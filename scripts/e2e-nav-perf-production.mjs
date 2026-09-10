#!/usr/bin/env node
/**
 * Light Production E2E for nav-perf + block confirm UX (review account only).
 * Does NOT leave a block row: confirm UI is opened then cancelled.
 * Optionally exercises block+unblock if RUN_BLOCK=1.
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'https://hanakai.kranz.design';
const COMMUNITY_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';
const DEMO_B = '42b4b32b-4f47-4d89-919a-80746a1e7327';
const REVIEWER = 'ce234973-4f67-4158-ad4f-fd88deffb18c';
const EMAIL = 'appstore-review@hanakai.kranz.design';
const RUN_BLOCK = process.env.RUN_BLOCK === '1';

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
const env = { ...loadEnvFile(resolve(ROOT, '.env.local')), ...loadEnvFile(resolve(ROOT, '.env.secrets.local')), ...process.env };

const results = {};
function pass(key, ok, detail) {
  results[key] = { ok, detail };
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}: ${detail}`);
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
  await page.goto(
    `${BASE}/api/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=/connections`,
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );
  await page.waitForURL((u) => !u.pathname.includes('/api/auth'), { timeout: 60000 });
  await page.goto(`${BASE}/connections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=過去のイベント', { timeout: 60000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 14'], locale: 'ja-JP' });
const page = await context.newPage();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

try {
  await loginMagic(page);
  pass('login', true, 'review account via magiclink');

  const bg1 = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  pass('cream_bg_connections', bg1 === 'rgb(250, 247, 242)', bg1);

  const reliableCount = await page.locator('a[data-reliable-nav="1"]').count();
  pass('reliable_nav_links', reliableCount > 0, `count=${reliableCount}`);

  const t0 = Date.now();
  await page.locator(`a[href="/connections/${COMMUNITY_ID}"]`).first().click();
  await page.waitForURL((u) => u.pathname.includes(`/connections/${COMMUNITY_ID}`), { timeout: 60000 });
  await page.waitForSelector('text=PARTICIPANTS', { timeout: 60000 });
  pass('nav_community_to_event', true, `${Date.now() - t0}ms`);

  const bg2 = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  pass('cream_bg_event', bg2 === 'rgb(250, 247, 242)', bg2);

  const t1 = Date.now();
  await page.locator('a', { hasText: 'プロフィールを見る' }).first().click();
  await page.waitForURL((u) => u.pathname.startsWith('/profile/'), { timeout: 60000 });
  await page.waitForSelector('text=ブロックする', { timeout: 60000 });
  pass('nav_event_to_profile', true, `${Date.now() - t1}ms`);

  await page.getByRole('button', { name: 'ブロックする' }).click();
  await page.getByRole('button', { name: 'キャンセル' }).waitFor({ timeout: 5000 });
  pass('block_confirm_ui', true, 'confirm visible');
  await page.getByRole('button', { name: 'キャンセル' }).click();
  await page.getByRole('button', { name: 'ブロックする' }).waitFor({ timeout: 5000 });
  pass('block_cancel', true, 'back to idle');

  if (RUN_BLOCK) {
    await page.getByRole('button', { name: 'ブロックする' }).click();
    await page.getByRole('button', { name: 'ブロックする' }).last().click();
    await page.waitForSelector('text=ブロックしました', { timeout: 30000 });
    pass('block_success_ui', true, 'success shown');
    await page.waitForURL((u) => u.pathname.includes(`/connections/${COMMUNITY_ID}`), { timeout: 60000 });
    pass('block_return_nav', true, page.url());
    // restore
    await admin.from('hanakai_member_blocks').delete().eq('blocker_member_id', REVIEWER).eq('blocked_member_id', DEMO_B);
    const { count } = await admin
      .from('hanakai_member_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('blocker_member_id', REVIEWER);
    pass('block_restored', (count ?? 0) === 0, `remaining=${count}`);
  }

  const failed = Object.values(results).some((r) => !r.ok);
  console.log(JSON.stringify({ ok: !failed, results }, null, 2));
  process.exitCode = failed ? 1 : 0;
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err), results }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
