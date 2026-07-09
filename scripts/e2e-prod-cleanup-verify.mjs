#!/usr/bin/env node
/**
 * Post-cleanup production smoke test (public pages + login page).
 * Login with rickyishido@gmail.com requires user password — not automated here.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://hanakai.kranz.design';
const OUT = path.join('scripts', 'e2e-screenshots', 'prod-cleanup-verify');

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const results = [];

  for (const [name, url] of [
    ['home', BASE],
    ['events', `${BASE}/events`],
    ['login', `${BASE}/login`],
    ['my', `${BASE}/my`],
  ]) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    results.push({ name, url: page.url(), status: res?.status() ?? 0 });
  }

  await browser.close();
  console.log(JSON.stringify({ outDir: OUT, results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
