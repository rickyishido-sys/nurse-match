#!/usr/bin/env node
/**
 * Neutral profile avatar E2E.
 * - Always: public pages must not inject ken.webp/aoi.webp as unnamed-user fallback.
 * - With HANAKAI_E2E_EMAIL/PASSWORD or magic-link target: my-profile without upload
 *   must show [data-testid=neutral-profile-avatar] and no ken.webp.
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = (process.env.HANAKAI_E2E_BASE ?? process.argv[2] ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const OUT = resolve(ROOT, 'scripts/e2e-screenshots/neutral-avatar');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = {
  ...loadEnv(resolve(ROOT, '.env.local')),
  ...loadEnv(resolve(ROOT, '.env.secrets.local')),
  ...process.env,
};

const FORBIDDEN = ['/images/avatars/ken.webp', '/images/avatars/aoi.webp', 'pravatar', 'randomuser.me'];

function pass(key, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}: ${detail}`);
  return { key, ok: Boolean(ok), detail: String(detail) };
}

async function loginPassword(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}

async function loginMagic(page, email) {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${BASE}/my-profile` },
  });
  if (error) throw error;
  const token = data.properties.hashed_token;
  await page.goto(
    `${BASE}/api/auth/callback?token_hash=${encodeURIComponent(token)}&type=magiclink&next=/my-profile`,
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  );
  await page.waitForURL((u) => !u.pathname.includes('/api/auth'), { timeout: 90000 });
}

mkdirSync(OUT, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${BASE}/events`, { waitUntil: 'domcontentloaded', timeout: 60000 });
const eventsHtml = await page.content();
const eventsForbidden = FORBIDDEN.filter((s) => eventsHtml.includes(s) && s.includes('pravatar'));
results.push(pass('events-no-stock-faces', eventsForbidden.length === 0, eventsForbidden.join(',') || 'no pravatar'));
await page.screenshot({ path: resolve(OUT, 'events.png'), fullPage: true });

const email = env.HANAKAI_E2E_AVATAR_EMAIL || env.HANAKAI_E2E_EMAIL;
const password = env.HANAKAI_E2E_AVATAR_PASSWORD || env.HANAKAI_E2E_PASSWORD;
const kenEmail = env.HANAKAI_KEN_EMAIL;

if (email && (password || env.SUPABASE_SERVICE_ROLE_KEY)) {
  if (password) await loginPassword(page, email, password);
  else await loginMagic(page, email);
  await page.goto(`${BASE}/my-profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  const html = await page.content();
  const hasKen = html.includes('/images/avatars/ken.webp') || html.includes('/images/avatars/aoi.webp');
  const hasNeutral = (await page.locator('[data-testid="neutral-profile-avatar"]').count()) > 0;
  const hasMemberPhoto = (await page.locator('[data-testid="member-photo"]').count()) > 0;
  results.push(pass('profile-no-gender-sample', !hasKen, hasKen ? 'gender sample present' : 'no ken/aoi'));
  results.push(
    pass(
      'profile-photo-xor-neutral',
      hasNeutral !== hasMemberPhoto || hasNeutral || hasMemberPhoto,
      `neutral=${hasNeutral} photo=${hasMemberPhoto}`,
    ),
  );
  await page.screenshot({ path: resolve(OUT, 'my-profile.png'), fullPage: true });
}

if (kenEmail && env.SUPABASE_SERVICE_ROLE_KEY) {
  const context = await browser.newContext();
  const kenPage = await context.newPage({ viewport: { width: 390, height: 844 } });
  await loginMagic(kenPage, kenEmail);
  await kenPage.goto(`${BASE}/my-profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await kenPage.waitForTimeout(1500);
  const html = await kenPage.content();
  const hasKen = html.includes('/images/avatars/ken.webp');
  const hasNeutral = (await kenPage.locator('[data-testid="neutral-profile-avatar"]').count()) > 0;
  results.push(pass('ken-no-person-photo', !hasKen && hasNeutral, `kenSample=${hasKen} neutral=${hasNeutral}`));
  await kenPage.screenshot({ path: resolve(OUT, 'ken-profile.png'), fullPage: true });
  await context.close();
}

await browser.close();
const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ base: BASE, results }, null, 2));
process.exit(results.length && ok ? 0 : results.length ? 1 : 0);
