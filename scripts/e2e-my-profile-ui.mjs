#!/usr/bin/env node
/**
 * Production smoke test for my-profile UX overhaul.
 * Optional auth: HANAKAI_E2E_EMAIL / HANAKAI_E2E_PASSWORD
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.HANAKAI_E2E_BASE ?? 'https://hanakai.kranz.design';
const OUT_DIR = 'scripts/e2e-screenshots';

const mustHave = [
  'プロフィール完成度',
  'あと',
  '項目でプロフィールが完成します',
  '次におすすめ',
  'イベントを見る',
  'あなたの記録',
  'イベントへ参加するたびに',
];

const mustNotHave = [
  'Bloom Profile',
  'Bloom Summary',
  'Bloom Timeline',
  'Bloom Tags',
  'Bloom Memory',
  'AI Reflection',
  'Bloom Phase 4',
];

async function loginWithPassword(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const email = process.env.HANAKAI_E2E_EMAIL ?? 'chikaraishido1+nm1783351032491@gmail.com';
  const password = process.env.HANAKAI_E2E_PASSWORD ?? 'E2eSnsTest!99';
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    if (email && password) {
      await loginWithPassword(page, email, password);
    }
    await page.goto(`${BASE}/my-profile`, { waitUntil: 'networkidle', timeout: 60000 });
    const html = await page.content();

    const present = Object.fromEntries(mustHave.map((t) => [t, html.includes(t)]));
    const absent = Object.fromEntries(mustNotHave.map((t) => [t, !html.includes(t)]));
    const hasOrganizeButton = html.includes('あなたらしさを整理する') || html.includes('あなたらしさを更新する');
    const hasPhotoEmpty =
      html.includes('プロフィール写真が未登録です') ||
      html.includes('プロフィール写真を登録する');

    results.push({
      viewport: vp.name,
      url: page.url(),
      loggedIn: Boolean(email && password),
      present,
      absent,
      hasOrganizeButton,
      hasPhotoEmpty,
    });

    await page.screenshot({ path: `${OUT_DIR}/my-profile-ux-${vp.name}.png`, fullPage: true });

    if (html.includes('プロフィール完成度')) {
      const incompleteBtn = page.locator('button', { hasText: 'プロフィール写真を登録する' }).first();
      if (await incompleteBtn.isVisible().catch(() => false)) {
        await incompleteBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${OUT_DIR}/my-profile-ux-${vp.name}-scroll.png`, fullPage: false });
      }
    }

    await page.close();
  }

  await browser.close();

  const ok =
    results.every((r) => Object.values(r.present).every(Boolean)) &&
    results.every((r) => Object.values(r.absent).every(Boolean));

  const report = { ok, base: BASE, results };
  fs.writeFileSync(`${OUT_DIR}/my-profile-ux-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
