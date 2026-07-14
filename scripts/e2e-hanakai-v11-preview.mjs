#!/usr/bin/env node
/**
 * HANAKAI Ver1.1 preview E2E verification.
 * Usage: node scripts/e2e-hanakai-v11-preview.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://localhost:3000').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-v11-preview');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

function loadEnv(filePath) {
  if (!exists(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) env[key] = val;
  }
  return env;
}

const env = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.HANAKAI_E2E_EMAIL ?? 'chikaraishido1+nm1783351032491@gmail.com';
const adminPassword = process.env.HANAKAI_E2E_PASSWORD ?? 'E2eSnsTest!99';

const results = [];

function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // ① 新規登録導線 — Header / Hero / Profile card
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(800);
  const landingHtml = await page.content();
  const headerRegister = landingHtml.includes('新規登録');
  const heroRegister = landingHtml.includes('イベントを見る') && landingHtml.includes('イベントを作る');
  record('1a-header-register', headerRegister, 'Header shows 新規登録 when logged out');
  record('1b-hero-ctas', heroRegister, 'Hero keeps イベントを見る / イベントを作る / 新規登録');
  await page.screenshot({ path: path.join(outDir, `${stamp}-01-landing-mobile.png`), fullPage: true });

  await page.evaluate(() => {
    const el = document.querySelector('a[href*="register"], button');
    const profileSection = [...document.querySelectorAll('p')].find((p) => p.textContent?.includes('プロフィール（イメージ）'));
    profileSection?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  const profileRegister = (await page.locator('text=新規登録').count()) >= 2;
  record('1c-profile-register', profileRegister, 'Profile card section has 新規登録 CTA');
  await page.screenshot({ path: path.join(outDir, `${stamp}-02-profile-card.png`) });

  // ② プロフィール画像
  const profileImg = page.locator('img[alt="プロフィール写真のサンプル"]');
  const imgVisible = (await profileImg.count()) > 0;
  let imgLoaded = false;
  if (imgVisible) {
    const src = await profileImg.getAttribute('src');
    imgLoaded = Boolean(src && (src.includes('profile-sample') || src.includes('images')));
    await profileImg.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(outDir, `${stamp}-03-profile-image.png`) });
  }
  record('2-profile-image', imgVisible && imgLoaded, 'Profile card shows profile-sample image', { src: imgVisible ? await profileImg.getAttribute('src') : null });

  // ⑥ Home(events) 導線
  await page.goto(`${baseUrl}/events`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  const eventsHtml = await page.content();
  const promoOk = eventsHtml.includes('まだ希望のイベントがありませんか？') && eventsHtml.includes('体験をリクエストする');
  record('6-events-promo', promoOk, 'Events page shows experience request promo card');
  await page.screenshot({ path: path.join(outDir, `${stamp}-04-events-promo.png`), fullPage: true });

  const promoLink = page.getByRole('link', { name: /リクエストする/ });
  if (await promoLink.count()) {
    await promoLink.first().click();
    await page.waitForURL(/experience-request/, { timeout: 30000 });
  } else {
    await page.goto(`${baseUrl}/experience-request`, { waitUntil: 'domcontentloaded' });
  }

  // ③ 体験リクエスト送信 + ④ Supabase保存
  const formHtml = await page.content();
  record('3-experience-page', formHtml.includes('あなたはどんな体験をしてみたいですか？'), 'Experience request page loads');

  const uniqueCity = `E2E区${Date.now().toString().slice(-6)}`;
  await page.getByRole('checkbox', { name: '花' }).check();
  await page.getByRole('checkbox', { name: '土曜日' }).check();
  await page.locator('select[name="prefecture"]').selectOption('神奈川県');
  await page.locator('input[name="city"]').fill(uniqueCity);
  await page.getByRole('radio', { name: '20代' }).check();
  await page.locator('textarea[name="comment"]').fill('E2E Ver1.1 体験リクエストテスト');
  await page.screenshot({ path: path.join(outDir, `${stamp}-05-experience-form-filled.png`), fullPage: true });

  await page.getByRole('button', { name: '体験リクエストを送る' }).click();
  await page.waitForURL(/experience-request\?sent=1/, { timeout: 60000 });
  const sentHtml = await page.content();
  const sentOk = sentHtml.includes('送信') || sentHtml.includes('ありがとう') || page.url().includes('sent=1');
  record('3-experience-submit', sentOk, 'Experience request form submitted', { url: page.url() });
  await page.screenshot({ path: path.join(outDir, `${stamp}-06-experience-sent.png`), fullPage: true });

  let dbOk = false;
  let dbCount = 0;
  if (supabaseUrl && serviceRole) {
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const { data, error } = await admin
      .from('experience_requests')
      .select('id, city, category')
      .eq('city', uniqueCity)
      .order('created_at', { ascending: false })
      .limit(5);
    dbOk = !error && Array.isArray(data) && data.length > 0;
    dbCount = data?.length ?? 0;
    record('4-supabase-save', dbOk, dbOk ? `Saved to experience_requests (${dbCount} row)` : `DB verify failed: ${error?.message ?? 'no rows'}`, {
      city: uniqueCity,
    });
  } else {
    record('4-supabase-save', false, 'Skipped DB verify — missing Supabase env');
  }

  // ⑤ 管理画面表示
  await page.goto(`${baseUrl}/login?next=${encodeURIComponent('/manage/experience-requests')}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('input[type="email"], input[name="email"]').first().fill(adminEmail);
  await page.locator('input[type="password"]').first().fill(adminPassword);
  await page.getByRole('button', { name: /ログイン|サインイン/ }).click();
  await page.waitForURL(/manage\/experience-requests/, { timeout: 90000 }).catch(() => null);
  await page.waitForTimeout(1000);

  const manageUrl = page.url();
  const onManage = manageUrl.includes('/manage/experience-requests');
  const manageHtml = await page.content();
  const manageTitle = manageHtml.includes('体験リクエスト');
  let groupVisible = false;
  if (onManage && manageTitle) {
    groupVisible = manageHtml.includes('花') && (manageHtml.includes(uniqueCity) || manageHtml.includes('件'));
    if (!groupVisible && uniqueCity) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const refreshed = await page.content();
      groupVisible = refreshed.includes('花') && (refreshed.includes(uniqueCity) || refreshed.includes('件'));
    }
  }
  record('5-manage-list', onManage && manageTitle, 'Manage experience requests page accessible', { url: manageUrl });
  record('5-manage-group', groupVisible || dbOk, 'Manage list shows request groups or DB has data');
  await page.screenshot({ path: path.join(outDir, `${stamp}-07-manage-list.png`), fullPage: true });

  if (groupVisible) {
    const groupLink = page.locator('a').filter({ hasText: '花' }).first();
    if (await groupLink.count()) {
      await groupLink.click();
      await page.waitForTimeout(1000);
      const detailHtml = await page.content();
      record('5-manage-detail', detailHtml.includes('希望者') || detailHtml.includes(uniqueCity), 'Manage detail shows requesters');
      await page.screenshot({ path: path.join(outDir, `${stamp}-08-manage-detail.png`), fullPage: true });
    }
  }

  await browser.close();

  const report = {
    baseUrl,
    stamp,
    results,
    allOk: results.every((r) => r.ok),
    screenshotsDir: outDir,
  };
  const reportPath = path.join(outDir, `${stamp}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  process.exit(report.allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
