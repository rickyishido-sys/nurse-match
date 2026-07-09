#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 Brand Redesign E2E — screenshots + checks.
 * Usage: node scripts/e2e-brand-redesign.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3001').replace(/\/$/, '');
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `brand-redesign-${label}`);

const pages = [
  { name: 'landing', path: '/', checks: ['華会', '人との時間を華やかにする', '毎週開催中', 'イベントを見る'] },
  { name: 'events', path: '/events', checks: ['体験からはじまる', '参加する'] },
  { name: 'login', path: '/login', checks: ['華会', 'おかえりなさい'] },
  { name: 'register', path: '/register', checks: ['華会', '新規登録'] },
  { name: 'not-found', path: '/brand-test-404', checks: ['ページが見つかりません'] },
  { name: 'contact', path: '/contact', checks: ['お問い合わせ'] },
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    for (const p of pages) {
      const res = await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(600);
      const html = await page.content();
      const checksOk = p.checks.every((c) => html.includes(c));
      await page.screenshot({
        path: path.join(outDir, `${vp.name}-${p.name}.png`),
        fullPage: p.name === 'landing' || p.name === 'events',
      });
      results.push({ viewport: vp.name, page: p.name, status: res?.status() ?? 0, checksOk, ok: checksOk });
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
