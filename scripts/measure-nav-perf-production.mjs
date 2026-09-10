#!/usr/bin/env node
/**
 * Measure key HANAKAI connection navigations (iPhone viewport).
 * Login via Supabase admin magiclink (no password change).
 *
 * Usage:
 *   BASE_URL=https://hanakai.kranz.design node scripts/measure-nav-perf-production.mjs
 *   BASE_URL=https://<preview>.vercel.app node scripts/measure-nav-perf-production.mjs
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = (process.env.BASE_URL || 'https://hanakai.kranz.design').replace(/\/$/, '');
const COMMUNITY_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';
const DEMO_B = '42b4b32b-4f47-4d89-919a-80746a1e7327';
const EMAIL = 'appstore-review@hanakai.kranz.design';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = val;
  }
  return out;
}

const env = {
  ...loadEnvFile(resolve(ROOT, '.env.local')),
  ...loadEnvFile(resolve(ROOT, '.env.secrets.local')),
  ...process.env,
};

function bgOf(page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
}

async function loginMagic(page) {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: EMAIL,
    options: { redirectTo: `${BASE}/connections` },
  });
  if (error) throw error;
  const tokenHash = data.properties.hashed_token;
  await page.goto(
    `${BASE}/api/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=/connections`,
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );
  await page.waitForURL((u) => !u.pathname.includes('/api/auth'), { timeout: 60000 });
  await page.goto(`${BASE}/connections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=過去のイベント', { timeout: 60000 });
}

async function measureNav(page, label, trigger) {
  const t0 = Date.now();
  await trigger();
  const clickToContentMs = Date.now() - t0;
  const bg = await bgOf(page);
  return {
    label,
    clickToContentMs,
    background: bg,
    url: page.url(),
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices['iPhone 14'],
  locale: 'ja-JP',
});
const page = await context.newPage();
const results = [];

try {
  await loginMagic(page);
  results.push({ label: 'login+connections', url: page.url(), background: await bgOf(page) });

  // Warm once then measure (second tap better matches real usage after prefetch).
  for (const pass of ['cold', 'warm']) {
    await page.goto(`${BASE}/connections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('text=過去のイベント', { timeout: 60000 });
    // Allow prefetch effect to settle on warm pass
    if (pass === 'warm') await page.waitForTimeout(1500);

    const a = await measureNav(page, `A connections→event (${pass})`, async () => {
      const link = page.locator(`a[href="/connections/${COMMUNITY_ID}"]`).first();
      await link.click();
      await page.waitForURL((u) => u.pathname.includes(`/connections/${COMMUNITY_ID}`), { timeout: 60000 });
      await page.waitForSelector('text=PARTICIPANTS', { timeout: 60000 });
    });
    results.push(a);

    if (pass === 'warm') await page.waitForTimeout(800);
    const b = await measureNav(page, `B participants→profile (${pass})`, async () => {
      const cta = page.locator('a', { hasText: 'プロフィールを見る' }).first();
      await cta.click();
      await page.waitForURL((u) => u.pathname.startsWith('/profile/'), { timeout: 60000 });
      await page.waitForSelector('text=ブロックする', { timeout: 60000 });
    });
    results.push(b);
  }

  const tConfirm0 = Date.now();
  await page.getByRole('button', { name: 'ブロックする' }).click();
  await page.getByRole('button', { name: 'キャンセル' }).waitFor({ timeout: 5000 });
  results.push({ label: 'block confirm UI', clickToUiMs: Date.now() - tConfirm0, background: await bgOf(page) });
  await page.getByRole('button', { name: 'キャンセル' }).click();

  // C: simulate block-complete return navigation (soft/hard via reliableNavigate path
  // without writing block rows — direct navigate to return URL with blocked=1)
  await page.goto(`${BASE}/profile/${DEMO_B}?returnTo=${encodeURIComponent(`/connections/${COMMUNITY_ID}`)}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('text=ブロックする', { timeout: 60000 });
  const c = await measureNav(page, 'C profile→participants (returnTo)', async () => {
    await page.evaluate((href) => {
      window.dispatchEvent(new CustomEvent('hanakai:nav-pending', { detail: { href } }));
      // Prefer soft; fall back hard like production helper
      const start = location.pathname + location.search;
      history.pushState({}, '', href);
      // Soft path isn't available outside Next router here — measure hard assign equivalent
      location.assign(href);
      return start;
    }, `/connections/${COMMUNITY_ID}?blocked=1`);
    await page.waitForURL((u) => u.pathname.includes(`/connections/${COMMUNITY_ID}`), { timeout: 60000 });
    await page.waitForSelector('text=PARTICIPANTS', { timeout: 60000 });
  });
  results.push(c);

  console.log(JSON.stringify({ ok: true, base: BASE, results }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ ok: false, base: BASE, error: String(err?.message || err), results }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
