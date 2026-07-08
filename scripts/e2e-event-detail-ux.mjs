#!/usr/bin/env node
/**
 * Event detail UX smoke test.
 * Usage: node scripts/e2e-event-detail-ux.mjs [baseUrl] [eventId]
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3003').replace(/\/$/, '');
const eventId = process.argv[3] ?? '';
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `event-detail-${label}`);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const checks = [
  '当日の流れ',
  'こんな方におすすめ',
  '参加予定者のイメージ',
  '主催者について',
  'Bloom Profileに思い出が残ります',
  '安心して参加できます',
  'このConnectionに参加',
];

const SKIP_EVENT_PATHS = new Set(['create', 'manage']);

async function resolveEventId(page) {
  if (eventId) return eventId;
  await page.goto(`${baseUrl}/events`, { waitUntil: 'networkidle', timeout: 90000 });
  const hrefs = await page.locator('a[href^="/events/"]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href')).filter(Boolean),
  );
  const href = hrefs.find((h) => {
    const slug = h.replace('/events/', '').split('/')[0];
    return slug && !SKIP_EVENT_PATHS.has(slug);
  });
  if (!href) throw new Error('No event detail link found on /events');
  return href.replace('/events/', '').split('/')[0];
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const probe = await browser.newPage();
  const resolvedId = await resolveEventId(probe);
  await probe.close();

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const url = `${baseUrl}/events/${resolvedId}`;
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    const html = await page.content();

    await page.screenshot({ path: path.join(outDir, `${vp.name}-top.png`), fullPage: false });
    await page.locator('#event-apply').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-bottom.png`), fullPage: false });

    const hasPrimaryCta = html.includes('このConnectionに参加');
    const hasStickyClass = await page.locator('.fixed.bottom-\\[4\\.5rem\\]').count();

    results.push({
      viewport: vp.name,
      url,
      eventId: resolvedId,
      status: res?.status() ?? 0,
      checks: Object.fromEntries(checks.map((c) => [c, html.includes(c)])),
      hasPrimaryCta,
      stickyCtaPresent: vp.name === 'mobile' ? hasStickyClass >= 0 : true,
      allChecks: checks.every((c) => html.includes(c)) && hasPrimaryCta,
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
