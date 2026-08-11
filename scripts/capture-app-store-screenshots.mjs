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
  /カード番号/,
  /MM\/YY/,
  /\bCVV\b/,
  /@gmail\.com/i,
  /@nursematch/i,
];

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

async function shot(page, fileName) {
  const file = path.join(OUT, fileName);
  await page.screenshot({ path: file, fullPage: false, type: 'png' });
  await ensurePng(file);
  const text = await page.locator('body').innerText();
  assertClean(fileName, text);
  return { file, text };
}

async function hidePaymentWidgets(page) {
  await page.addStyleTag({
    content: `
      iframe.sq-card-component,
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
  await hidePaymentWidgets(page);
  {
    const r = await shot(page, '02-event-detail-1290x2796.png');
    manifest.push({
      order: 2,
      file: '02-event-detail-1290x2796.png',
      screen: 'イベント詳細',
      path: `/events/${EVENT_ID}`,
      notes: '日時・場所・説明・参加導線',
    });
    if (!/開催日時|場所|定員/.test(r.text)) throw new Error('detail missing meta');
  }

  // 3. Apply — prefer reason form; never leave card number UI visible
  await go(page, `${BASE}/events/${EVENT_ID}`);
  await hidePaymentWidgets(page);
  const apply = page.locator('#event-apply');
  await apply.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const reason = page.locator('textarea[name="reason"], #reason');
  if (await reason.count()) {
    await reason.fill('花が好きで、少人数の場でゆっくり話してみたいです。');
  } else {
    console.warn('WARN: reason textarea not found — capturing apply section without submitting. Verify card UI is hidden.');
  }
  // Ensure Square card chrome is not in viewport text after hide
  {
    const r = await shot(page, '03-event-apply-1290x2796.png');
    if (/カード番号|MM\/YY|\bCVV\b/.test(r.text)) {
      throw new Error('Apply screenshot still exposes payment card UI');
    }
    if (!/500|選ばれ|参加/.test(r.text)) {
      throw new Error('Apply screenshot missing fee / apply copy');
    }
    manifest.push({
      order: 3,
      file: '03-event-apply-1290x2796.png',
      screen: '参加申請',
      path: `/events/${EVENT_ID}#event-apply`,
      notes: '参加理由/利用料説明。カードUI非表示。送信・課金なし',
    });
  }

  // 4. Profile
  await go(page, `${BASE}/my-profile`);
  {
    const r = await shot(page, '04-profile-1290x2796.png');
    if (/@/.test(r.text)) throw new Error('Profile exposes email-like text');
    manifest.push({
      order: 4,
      file: '04-profile-1290x2796.png',
      screen: 'プロフィール',
      path: '/my-profile',
      notes: '写真・自己紹介・本人確認等',
    });
  }

  // 5. Community
  await go(page, `${BASE}/connections`);
  {
    await shot(page, '05-community-1290x2796.png');
    manifest.push({
      order: 5,
      file: '05-community-1290x2796.png',
      screen: 'コミュニティ',
      path: '/connections',
      notes: 'イベント参加後のつながり記録',
    });
  }

  // 6. Host — prefer create form; fallback manage if host of review event
  await go(page, `${BASE}/events/create`);
  let hostPath = '/events/create';
  if (page.url().includes('/login')) {
    throw new Error('Not authenticated for /events/create');
  }
  // If create page is thin, try manage for review event
  const createText = await page.locator('body').innerText();
  if (/作成|カテゴリ|開催/.test(createText)) {
    await shot(page, '06-host-create-1290x2796.png');
    manifest.push({
      order: 6,
      file: '06-host-create-1290x2796.png',
      screen: 'イベント作成（主催者体験）',
      path: hostPath,
      notes: '誰でも主催できる導線',
    });
  } else {
    hostPath = `/events/manage/${EVENT_ID}`;
    await go(page, `${BASE}${hostPath}`);
    await shot(page, '06-host-manage-1290x2796.png');
    manifest.push({
      order: 6,
      file: '06-host-manage-1290x2796.png',
      screen: '主催イベント管理',
      path: hostPath,
      notes: '参加メンバー選定/管理',
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
