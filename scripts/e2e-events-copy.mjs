#!/usr/bin/env node
/**
 * Capture /events hero copy at mobile, tablet, desktop viewports.
 * Usage: node scripts/e2e-events-copy.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `events-copy-${label}`);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const expectedHeading = '参加したいConnectionを見つける';
const expectedSubcopy =
  '花・コーヒー・食事・散歩など、興味のある体験から新しいConnectionを見つけてください。';
const oldHeading = '気になる世界観を選ぶ';

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const res = await page.goto(`${baseUrl}/events`, { waitUntil: 'networkidle', timeout: 60000 });
    const html = await page.content();
    const shot = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    const heading = await page.locator('h1').first().textContent();
    const subcopy = await page.locator('h1').first().locator('xpath=following-sibling::p[1]').textContent();

    results.push({
      viewport: vp.name,
      status: res?.status() ?? 0,
      screenshot: shot,
      heading: heading?.trim() ?? '',
      subcopy: subcopy?.trim() ?? '',
      headingOk: (heading?.trim() ?? '') === expectedHeading,
      subcopyOk: (subcopy?.trim() ?? '') === expectedSubcopy,
      oldHeadingGone: !html.includes(oldHeading),
    });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify({ baseUrl, label, results }, null, 2));
  const allOk = results.every((r) => r.headingOk && r.subcopyOk && r.oldHeadingGone && r.status < 400);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
