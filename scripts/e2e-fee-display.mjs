#!/usr/bin/env node
/**
 * HANAKAI fee display verification screenshots.
 * Usage: node scripts/e2e-fee-display.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const eventIdArg = process.argv[3] ?? '';
const label = baseUrl.includes('localhost') ? 'local' : 'prod';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join('scripts', 'e2e-screenshots', `fee-display-${label}`, stamp);

const viewports = [
  { name: '390px', width: 390, height: 844 },
  { name: '1280px', width: 1280, height: 900 },
];

const REQUIRED = [
  'HANAKAI利用料',
  '500円',
  '参加メンバーに選ばれた場合のみ自動請求',
  'イベント参加費',
  '当日現地払い',
  'ご参加前にご確認ください',
];

const SKIP = new Set(['create', 'manage', 'edit', 'participation']);

async function resolveEventId(page) {
  if (eventIdArg) return eventIdArg;
  await page.goto(`${baseUrl}/events`, { waitUntil: 'networkidle', timeout: 90000 });
  const hrefs = await page.locator('a[href^="/events/"]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href')).filter(Boolean),
  );
  const href = hrefs.find((h) => {
    const slug = h.replace('/events/', '').split('/')[0];
    return slug && !SKIP.has(slug);
  });
  if (!href) throw new Error('No event detail link found');
  return href.replace('/events/', '').split('/')[0];
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { baseUrl, outDir, pages: [] };

  const probe = await browser.newPage();
  let eventId = eventIdArg;
  if (!eventId) {
    try {
      eventId = await resolveEventId(probe);
    } catch {
      eventId = '';
    }
  }
  await probe.close();

  const paths = [
    ...(eventId ? [{ name: 'event-detail', url: `/events/${eventId}` }] : []),
    { name: 'event-create', url: '/events/create' },
  ];

  for (const vp of viewports) {
    for (const target of paths) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = `${baseUrl}${target.url}`;
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });

      if (target.name === 'event-detail') {
        await page.locator('header').first().scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(outDir, `${target.name}-fee-cards-${vp.name}.png`),
          fullPage: false,
        });
        await page.locator('text=ご参加前にご確認ください').scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(outDir, `${target.name}-notice-${vp.name}.png`),
          fullPage: false,
        });
        await page.locator('#event-apply').scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(outDir, `${target.name}-apply-${vp.name}.png`),
          fullPage: false,
        });
      } else {
        await page.locator('text=イベント参加費').first().waitFor({ timeout: 15000 }).catch(() => {});
        await page.locator('text=イベント参加費').first().scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(outDir, `${target.name}-${vp.name}.png`),
          fullPage: false,
        });
      }

      const html = await page.content();
      const checks = Object.fromEntries(REQUIRED.map((t) => [t, html.includes(t)]));
      report.pages.push({
        viewport: vp.name,
        path: target.url,
        status: res?.status() ?? 0,
        checks,
        pass: target.name === 'event-create'
          ? html.includes('イベント参加費') && html.includes('HANAKAI利用料')
          : REQUIRED.every((t) => html.includes(t)),
      });
      await page.close();
    }
  }

  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  const failed = report.pages.filter((p) => !p.pass);
  if (failed.length) {
    console.error('FAILED', failed.length);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
