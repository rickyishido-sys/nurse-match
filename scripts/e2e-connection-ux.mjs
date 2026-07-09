#!/usr/bin/env node
/**
 * HANAKAI Connection UX smoke test — landing definition, events, CTAs, /my redirect.
 * Usage: node scripts/e2e-connection-ux.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3001').replace(/\/$/, '');
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', `connection-ux-${label}`);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const landingChecks = [
  'HANAKAI Connectionとは',
  'Connectionの循環',
  'リアルイベント',
  'イベントを見る',
];

const eventsChecks = [
  '体験からはじまる',
  '参加する',
  '詳しく見る',
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // Landing
    const landingRes = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const landingHtml = await page.content();
    await page.locator('#hanakai-connection').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-landing-definition.png`), fullPage: false });

    const noJoinCta = !landingHtml.includes('参加登録する');
    const landingOk = landingChecks.every((c) => landingHtml.includes(c)) && noJoinCta;

    // Events list
    const eventsRes = await page.goto(`${baseUrl}/events`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const eventsHtml = await page.content();
    await page.screenshot({ path: path.join(outDir, `${vp.name}-events-list.png`), fullPage: false });
    const eventsOk = eventsChecks.every((c) => eventsHtml.includes(c));
    const noConnectionCta = !eventsHtml.includes('このConnectionに参加する');

    // /my redirect (unauthenticated → login)
    const myRes = await page.goto(`${baseUrl}/my`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const myUrl = page.url();
    const myOk = myUrl.includes('/login');

    results.push({
      viewport: vp.name,
      landing: { status: landingRes?.status() ?? 0, ok: landingOk, noJoinCta },
      events: { status: eventsRes?.status() ?? 0, ok: eventsOk, noConnectionCta },
      myRedirect: { status: myRes?.status() ?? 0, url: myUrl, ok: myOk },
    });

    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify({ baseUrl, label, outDir, results }, null, 2));
  const ok = results.every((r) => r.landing.ok && r.events.ok && r.myRedirect.ok);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
