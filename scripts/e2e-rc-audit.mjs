#!/usr/bin/env node
/**
 * HANAKAI Connection Ver1.0 RC Audit — full-page smoke + screenshots.
 * Usage: node scripts/e2e-rc-audit.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3001').replace(/\/$/, '');
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `rc-audit-${label}`);

const pages = [
  { name: 'landing', path: '/', checks: ['HANAKAI Connectionとは', 'イベントを見る'], scanForbidden: true },
  { name: 'login', path: '/login', checks: ['おかえりなさい', 'はじめての方は新規登録へ'], scanForbidden: true },
  { name: 'register', path: '/register', checks: ['新規登録', '認証リンクを送る'], scanForbidden: true },
  { name: 'events', path: '/events', checks: ['イベント', '参加する'], scanForbidden: true },
  { name: 'contact', path: '/contact', checks: ['お問い合わせ'], scanForbidden: false },
  { name: 'terms', path: '/terms', checks: ['利用規約'], scanForbidden: false },
  { name: 'privacy', path: '/privacy', checks: ['プライバシー'], scanForbidden: false },
  { name: 'account-delete', path: '/account/delete', checks: ['ログイン'], scanForbidden: false },
  { name: 'connections', path: '/connections', checks: ['イベントを見る'], scanForbidden: true },
  { name: 'my-redirect', path: '/my', checks: [], scanForbidden: false },
  { name: 'not-found', path: '/this-page-does-not-exist-rc', checks: ['ページが見つかりません'], scanForbidden: false },
  { name: 'event-not-found', path: '/events/nonexistent-event-id-rc', checks: ['イベントが見つかりません'], scanForbidden: false },
  { name: 'manifest', path: '/manifest.webmanifest', checks: ['HANAKAI Connection', 'standalone'], scanForbidden: false },
];

const forbiddenTerms = ['参加登録する', 'このConnectionに参加する', '申し込む', '応募する'];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];

async function checkHorizontalScroll(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    for (const p of pages) {
      const url = `${baseUrl}${p.path}`;
      let res;
      try {
        res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) {
        results.push({ viewport: vp.name, page: p.name, ok: false, error: String(e) });
        continue;
      }

      await page.waitForTimeout(400);
      const html = await page.content();
      const finalUrl = page.url();
      const hScroll = await checkHorizontalScroll(page);

      const checksOk = p.checks.every((c) => html.includes(c));
      const noForbidden = !p.scanForbidden || !forbiddenTerms.some((t) => html.includes(t));
      const myOk = p.name !== 'my-redirect' || finalUrl.includes('/login');

      await page.screenshot({
        path: path.join(outDir, `${vp.name}-${p.name}.png`),
        fullPage: p.name === 'landing' || p.name === 'events',
      });

      results.push({
        viewport: vp.name,
        page: p.name,
        status: res?.status() ?? 0,
        url: finalUrl,
        checksOk,
        noForbidden,
        myOk,
        hScroll,
        ok: checksOk && noForbidden && myOk && !hScroll,
      });
    }

    await page.close();
  }

  await browser.close();

  const report = { baseUrl, label, outDir, results, passed: results.every((r) => r.ok) };
  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
