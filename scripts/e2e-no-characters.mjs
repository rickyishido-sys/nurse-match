#!/usr/bin/env node
/**
 * Ver1.0 — アルファベットキャラクター装飾が非表示であることを確認
 * Usage: node scripts/e2e-no-characters.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'preview';
const outDir = path.join('scripts', 'e2e-screenshots', `no-characters-${label}`);

const pages = [
  { name: 'landing', path: '/', fullPage: true },
  { name: 'events', path: '/events', fullPage: true },
  { name: 'login', path: '/login', fullPage: false },
  { name: 'register', path: '/register', fullPage: false },
  { name: 'not-found', path: '/brand-test-404', fullPage: false },
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
      await page.waitForTimeout(500);
      const charCount = await page.locator('[data-brand-character]').count();
      const checksOk = charCount === 0;
      await page.screenshot({
        path: path.join(outDir, `${vp.name}-${p.name}.png`),
        fullPage: p.fullPage,
      });
      results.push({
        viewport: vp.name,
        page: p.name,
        status: res?.status() ?? 0,
        charCount,
        checksOk,
        ok: checksOk,
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
