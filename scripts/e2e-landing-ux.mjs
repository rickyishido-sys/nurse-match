#!/usr/bin/env node
/**
 * Landing UX smoke test — hero copy, sections, viewports.
 * Usage: node scripts/e2e-landing-ux.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://localhost:3001';
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `landing-ux-${label}`);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const checks = [
  'リアルで出会う Connection コミュニティ',
  '体験を通じて',
  '参加までの流れ',
  'プロフィール作成',
  'AIが、あなたらしさを',
  '安心して参加できる仕組み',
  '参加者の声',
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const res = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90000 });
    const html = await page.content();
    await page.screenshot({ path: path.join(outDir, `${vp.name}-hero.png`), fullPage: false });

    await page.locator('#how-it-works').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-steps.png`), fullPage: false });

    results.push({
      viewport: vp.name,
      status: res?.status() ?? 0,
      checks: Object.fromEntries(checks.map((c) => [c, html.includes(c)])),
      allChecks: checks.every((c) => html.includes(c)),
    });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify({ baseUrl, label, outDir, results }, null, 2));
  const ok = results.every((r) => r.status < 400 && r.allChecks);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
