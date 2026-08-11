#!/usr/bin/env node
/**
 * Verify Production login with HANAKAI_REVIEW_* from .env.secrets.local.
 * Never prints credentials. Does not apply / pay / edit profile.
 */
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://hanakai.kranz.design';

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) env[key] = val;
  }
  return env;
}

const fileEnv = {
  ...loadEnv(path.join(root, '.env.secrets.local')),
  ...loadEnv(path.join(root, '.env.local')),
};
const email = process.env.HANAKAI_REVIEW_EMAIL || fileEnv.HANAKAI_REVIEW_EMAIL;
const password = process.env.HANAKAI_REVIEW_PASSWORD || fileEnv.HANAKAI_REVIEW_PASSWORD;

if (!email || !password) {
  console.error('FAIL: HANAKAI_REVIEW_EMAIL / HANAKAI_REVIEW_PASSWORD not set in env or .env.secrets.local');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, locale: 'ja-JP' });
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(2500);
const url = page.url();
const ok = !url.includes('/login');
await browser.close();

if (!ok) {
  console.error('FAIL: still on login after submit');
  process.exit(1);
}
console.log('PASS: Production login succeeded with HANAKAI_REVIEW_*');
console.log('HANAKAI_REVIEW_EMAIL / PASSWORD の準備完了');
