#!/usr/bin/env node
/**
 * Capture App Store iPhone 6.7" (1290×2796) screenshots from Production.
 *
 * Size source (Apple Screenshot specifications):
 *   6.9" Display accepts 1290×2796 (legacy 6.7" / iPhone 15 Pro Max class).
 *
 * Auth (never logged):
 *   HANAKAI_REVIEW_EMAIL
 *   HANAKAI_REVIEW_PASSWORD
 *   optional: .env.secrets.local with the same keys
 *
 * Usage:
 *   HANAKAI_REVIEW_EMAIL=... HANAKAI_REVIEW_PASSWORD=... node scripts/capture-app-store-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { existsSync, readFileSync, renameSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const BASE = (process.env.HANAKAI_E2E_BASE ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const OUT = path.join(root, 'docs/store-submission/screenshots/ios-6.7');
const EVENT_ID = process.env.HANAKAI_REVIEW_EVENT_ID ?? 'a27f5be8-a875-461c-9fd1-adfb936410ff';

// iPhone 15 Pro Max logical CSS × 3 = 1290×2796 (App Store 6.7" / 6.9" accepted size)
const VIEWPORT = { width: 430, height: 932 };
const DPR = 3;
const TARGET_W = 1290;
const TARGET_H = 2796;

const FORBIDDEN_TEXT = [
  /nursematch/i,
  /test-female@/i,
  /test-male@/i,
  /smoke/i,
  /e2e主催/i,
  /e2e参加/i,
  /カード番号/,
  /MM\/YY/,
  /\bCVV\b/,
  /@gmail\.com/i,
  /@nursematch/i,
  /@test\.hanakai\.local/i,
];

const EMAIL_LIKE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

function loadCreds() {
  if (process.env.HANAKAI_REVIEW_EMAIL && process.env.HANAKAI_REVIEW_PASSWORD) {
    return {
      email: process.env.HANAKAI_REVIEW_EMAIL,
      password: process.env.HANAKAI_REVIEW_PASSWORD,
      source: 'env',
    };
  }
  const secretPath = path.join(root, '.env.secrets.local');
  if (existsSync(secretPath)) {
    const text = readFileSync(secretPath, 'utf8');
    const email = text.match(/^HANAKAI_REVIEW_EMAIL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
    const password = text.match(/^HANAKAI_REVIEW_PASSWORD=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
    if (email && password) return { email, password, source: '.env.secrets.local' };
  }
  return null;
}

async function ensurePng(file) {
  let img = sharp(file);
  const meta = await img.metadata();
  if (meta.hasAlpha) {
    const tmp = `${file}.noalpha.png`;
    await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().png().toFile(tmp);
    renameSync(tmp, file);
    img = sharp(file);
  }
  const finalMeta = await sharp(file).metadata();
  if (finalMeta.width !== TARGET_W || finalMeta.height !== TARGET_H) {
    const tmp = `${file}.resized.png`;
    await sharp(file)
      .resize(TARGET_W, TARGET_H, { fit: 'fill' })
      .png()
      .toFile(tmp);
    renameSync(tmp, file);
  }
  const check = await sharp(file).metadata();
  if (check.width !== TARGET_W || check.height !== TARGET_H) {
    throw new Error(`${path.basename(file)} size ${check.width}x${check.height}, expected ${TARGET_W}x${TARGET_H}`);
  }
  if (check.hasAlpha) throw new Error(`${path.basename(file)} still has alpha`);
  return check;
}

function assertClean(label, text) {
  for (const re of FORBIDDEN_TEXT) {
    if (re.test(text)) {
      throw new Error(`[${label}] forbidden content matched: ${re}`);
    }
  }
}

async function login(page, creds) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);
  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  if (page.url().includes('/login')) {
    throw new Error('Login failed (still on /login). Check HANAKAI_REVIEW_* credentials.');
  }
}

async function go(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function visibleText(page) {
  return page.evaluate(() => {
    const ban = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    const parts = [];
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 1) {
        const el = /** @type {Element} */ (node);
        if (ban.has(el.tagName)) return;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        for (const child of el.childNodes) walk(child);
        return;
      }
      if (node.nodeType === 3) {
        const t = (node.textContent || '').trim();
        if (t) parts.push(t);
      }
    };
    walk(document.body);
    return parts.join('\n');
  });
}

async function shot(page, fileName, { hideCardUi = false } = {}) {
  await prepareStoreChrome(page, { hideCardUi });
  await page.waitForTimeout(300);
  const file = path.join(OUT, fileName);
  await page.screenshot({ path: file, fullPage: false, type: 'png' });
  await ensurePng(file);
  const text = await visibleText(page);
  assertClean(fileName, text);
  if (EMAIL_LIKE.test(text)) {
    throw new Error(`[${fileName}] email still visible in screenshot chrome`);
  }
  return { file, text };
}

/** Screenshot-only chrome: hide email in header + Square card input (no DB/Auth changes). */
async function prepareStoreChrome(page, { hideCardUi = false } = {}) {
  await page.evaluate(({ hideCardUi }) => {
    const hide = (el) => {
      if (!el) return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    };

    // Header shows email under nickname — blank for App Store shots only.
    const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    for (const el of document.querySelectorAll('span, p')) {
      const t = (el.textContent || '').trim();
      if (emailRe.test(t) && t.length < 120 && !el.closest('#event-apply')) {
        hide(el);
      }
    }

    // Site footer often includes a "ログイン" link — hide for store shots.
    for (const el of document.querySelectorAll('footer')) hide(el);

    if (!hideCardUi) return;

    for (const el of document.querySelectorAll(
      'iframe.sq-card-component, iframe[src*="square"], .sq-card-wrapper, .sq-card-iframe-container, [id^="single-card-wrapper"]',
    )) {
      hide(el);
    }

    // Hide SquareCardRegistration root (h2 "お支払い方法の登録") without removing apply intro.
    for (const h2 of document.querySelectorAll('h2')) {
      if ((h2.textContent || '').trim() === 'お支払い方法の登録') {
        hide(h2.closest('.space-y-4') || h2.parentElement || h2);
      }
    }

    for (const btn of document.querySelectorAll('button')) {
      const t = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.includes('カードを保存') || t.includes('カード番号')) hide(btn);
    }
    for (const label of document.querySelectorAll('label')) {
      const t = (label.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.includes('カード情報をSquare') || t.includes('カード番号') || /\bCVV\b/.test(t)) {
        hide(label);
      }
    }
  }, { hideCardUi });

  await page.addStyleTag({
    content: `
      footer {
        display: none !important;
        visibility: hidden !important;
      }
      iframe.sq-card-component,
      iframe[src*="squarecdn.com"],
      .sq-card-wrapper,
      .sq-card-iframe-container,
      [id^="single-card-wrapper"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `,
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const creds = loadCreds();
  if (!creds) {
    console.error(
      [
        'Missing App Store review credentials.',
        'Set HANAKAI_REVIEW_EMAIL and HANAKAI_REVIEW_PASSWORD',
        'or add them to .env.secrets.local (gitignored).',
        'Do not use Smoke / E2E test accounts.',
      ].join('\n'),
    );
    process.exit(2);
  }
  console.log(`Auth source: ${creds.source} (credentials not printed)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
    isMobile: true,
    hasTouch: true,
    locale: 'ja-JP',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  await login(page, creds);

  const manifest = [];

  // 1. Events list — scroll so event card is in view
  await go(page, `${BASE}/events`);
  const card = page.locator(`a[href="/events/${EVENT_ID}"]`).first();
  if (await card.count()) await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  {
    const r = await shot(page, '01-events-list-1290x2796.png');
    manifest.push({
      order: 1,
      file: '01-events-list-1290x2796.png',
      screen: 'イベント一覧',
      path: '/events',
      notes: '公開イベントカード中心',
    });
    if (!/イベント/.test(r.text)) throw new Error('events list missing イベント');
  }

  // 2. Event detail (top)
  await go(page, `${BASE}/events/${EVENT_ID}`);
  {
    const r = await shot(page, '02-event-detail-1290x2796.png', { hideCardUi: true });
    manifest.push({
      order: 2,
      file: '02-event-detail-1290x2796.png',
      screen: 'イベント詳細',
      path: `/events/${EVENT_ID}`,
      notes: '日時・場所・説明・参加導線',
    });
    if (!/開催日時|場所|定員|審査用/.test(r.text)) throw new Error('detail missing meta');
  }

  // 3. Apply — never submit; never show Square card number / MM/YY / CVV
  await go(page, `${BASE}/events/${EVENT_ID}`);
  await page.waitForTimeout(800);
  const reason = page.locator('textarea[name="reason"], #reason');
  if (await reason.count()) {
    await reason.fill('花が好きで、少人数の場でゆっくり話してみたいです。');
  } else {
    console.warn(
      'WARN: reason form gated by payment method on Production — capturing apply section with card input chrome hidden (no card save, no submit).',
    );
  }
  // Keep event title context above apply; avoid scrolling into empty footer.
  await page.evaluate(() => {
    const el = document.querySelector('#event-apply');
    if (!el) return;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const y = window.scrollY;
    // Prefer a bit of detail above the apply heading when possible.
    window.scrollTo({ top: Math.max(0, y - 180), behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  {
    const r = await shot(page, '03-event-apply-1290x2796.png', { hideCardUi: true });
    if (/カード番号|MM\/YY|\bCVV\b|カードを保存して続ける|お支払い方法の登録/.test(r.text)) {
      throw new Error('Apply screenshot still exposes payment card UI');
    }
    if (!/参加する|申請|想い|利用料|500|審査用/.test(r.text)) {
      throw new Error('Apply screenshot missing apply copy');
    }
    manifest.push({
      order: 3,
      file: '03-event-apply-1290x2796.png',
      screen: '参加申請',
      path: `/events/${EVENT_ID}#event-apply`,
      notes: '参加申請セクション。カード入力UI非表示。送信・課金・カード登録なし',
    });
  }

  // 4. Profile
  await go(page, `${BASE}/my-profile`);
  {
    const r = await shot(page, '04-profile-1290x2796.png');
    if (EMAIL_LIKE.test(r.text)) throw new Error('Profile exposes email');
    if (!/レビュー太郎|プロフィール|本人確認/.test(r.text)) {
      throw new Error('Profile missing expected content');
    }
    manifest.push({
      order: 4,
      file: '04-profile-1290x2796.png',
      screen: 'プロフィール',
      path: '/my-profile',
      notes: '写真・自己紹介・本人確認等（メール非表示）',
    });
  }

  // 5. Community
  await go(page, `${BASE}/connections`);
  {
    const r = await shot(page, '05-community-1290x2796.png');
    if (!/コミュニティ|つなが|参加/.test(r.text)) {
      throw new Error('Community missing expected copy');
    }
    manifest.push({
      order: 5,
      file: '05-community-1290x2796.png',
      screen: 'コミュニティ',
      path: '/connections',
      notes: 'イベント参加後のつながり記録',
    });
  }

  // 6. Host create form — do not submit / create event
  await go(page, `${BASE}/events/create`);
  if (page.url().includes('/login')) {
    throw new Error('Not authenticated for /events/create');
  }
  const createText = await visibleText(page);
  if (!/作成|カテゴリ|開催/.test(createText)) {
    throw new Error('Create page missing expected host UI');
  }
  {
    await shot(page, '06-host-create-1290x2796.png');
    manifest.push({
      order: 6,
      file: '06-host-create-1290x2796.png',
      screen: 'イベント作成（主催者体験）',
      path: '/events/create',
      notes: '作成フォーム表示のみ。イベントは作成しない',
    });
  }

  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    pixelSize: `${TARGET_W}x${TARGET_H}`,
    appleDisplayClass: '6.9" Display (accepts 1290×2796 — former 6.7")',
    format: 'PNG, no alpha',
    ascUploadReady: true,
    uploadPerformed: false,
    authSource: creds.source,
    shots: manifest,
  };
  writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(report, null, 2));
  console.log(`Wrote ${manifest.length} screenshots to ${OUT}`);
  for (const s of manifest) console.log(`  ${s.order}. ${s.file} — ${s.screen}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
