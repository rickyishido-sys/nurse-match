#!/usr/bin/env node
/**
 * Production smoke test for /events list UX.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'https://hanakai.kranz.design';
const OUT_DIR = 'scripts/e2e-screenshots';

const mustHave = [
  '体験からはじまる',
  'カテゴリーから探す',
  '参加する',
  '詳しく見る',
  '参加予定者のイメージ',
  '主催者',
  '現在',
  '名が参加予定',
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/events`, { waitUntil: 'networkidle', timeout: 60000 });
    const html = await page.content();
    const present = Object.fromEntries(mustHave.map((t) => [t, html.includes(t)]));
    const noLongCta = !html.includes('このConnectionに参加する');
    const buttonLayout = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a')).filter((a) => {
        const text = a.textContent?.trim() ?? '';
        return text === '参加する' || text === '詳しく見る';
      });
      return buttons.map((btn) => ({
        text: btn.textContent?.trim(),
        nowrap: getComputedStyle(btn).whiteSpace === 'nowrap',
        height: Math.round(btn.getBoundingClientRect().height),
        overflow: btn.scrollWidth <= btn.clientWidth + 1,
      }));
    });
    const hasCategoryChips = html.includes('花') && html.includes('コーヒー') && html.includes('交流');
    const hasTrust = html.includes('通報機能あり') || html.includes('本人確認');
    const gridCols = await page.evaluate(() => {
      const grid = document.querySelector('.grid');
      if (!grid) return null;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });

    results.push({
      viewport: vp.name,
      present,
      noLongCta,
      buttonLayout,
      hasCategoryChips,
      hasTrust,
      gridCols,
      url: page.url(),
    });

    await page.screenshot({ path: `${OUT_DIR}/events-ux-${vp.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  const ok = results.every(
    (r) =>
      Object.values(r.present).every(Boolean) &&
      r.noLongCta &&
      r.hasCategoryChips &&
      r.hasTrust &&
      r.buttonLayout.length > 0 &&
      r.buttonLayout.every((b) => b.nowrap && b.overflow && b.height >= 40),
  );
  const report = { ok, base: BASE, results };
  fs.writeFileSync(`${OUT_DIR}/events-ux-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
