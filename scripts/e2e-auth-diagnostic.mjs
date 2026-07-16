#!/usr/bin/env node
/** Auth cookie diagnostic for Playwright / middleware debugging */
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? 'http://127.0.0.1:3005').replace(/\/$/, '');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const email = env.HANAKAI_V10_E2E_UNSUBMITTED_EMAIL || env.HANAKAI_E2E_PARTICIPANT_EMAIL;
const password = env.HANAKAI_V10_E2E_PASSWORD || env.HANAKAI_E2E_PARTICIPANT_PASSWORD;
if (!email || !password) {
  console.error('Missing E2E credentials');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const loginResponses = [];
page.on('response', (res) => {
  if (res.request().method() === 'POST' && res.url().includes('/login')) {
    loginResponses.push({
      url: res.url(),
      status: res.status(),
      setCookie: res.headers()['set-cookie'] ?? null,
    });
  }
});

await page.goto(`${baseUrl}/login?next=${encodeURIComponent('/my-profile')}`);
await page.locator('input[name="email"]').fill(email);
await page.locator('input[name="password"]').fill(password);
await Promise.all([
  page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 60000 }).catch(() => null),
  page.getByRole('button', { name: 'ログイン' }).click(),
]);
await page.waitForTimeout(2000);

const cookiesAfterLogin = await context.cookies();
console.log('LOGIN_RESPONSES', JSON.stringify(loginResponses, null, 2));
console.log('COOKIES_AFTER_LOGIN', JSON.stringify(cookiesAfterLogin, null, 2));
console.log('URL_AFTER_LOGIN', page.url());

await page.goto(`${baseUrl}/my-profile`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
console.log('URL_AFTER_MY_PROFILE', page.url());

const myProfileRes = await page.request.get(`${baseUrl}/my-profile`);
console.log('MY_PROFILE_REQUEST', {
  status: myProfileRes.status(),
  finalUrl: myProfileRes.url(),
  hasIdentityCopy: (await myProfileRes.text()).includes('本人確認書類が未提出です'),
});

await browser.close();
