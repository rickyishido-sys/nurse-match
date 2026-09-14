#!/usr/bin/env node
/**
 * Multi-run median nav timings for Before/After comparison.
 * Usage: RUNS=5 LABEL=before BASE_URL=... node scripts/measure-nav-perf-median.mjs
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = (process.env.BASE_URL || process.env.BASE_URL || 'https://hanakai.kranz.design').replace(/\/$/, '');
const RUNS = Math.max(3, Number(process.env.RUNS || 5));
const LABEL = process.env.LABEL || 'run';
const COMMUNITY_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';
const DEMO_B = '42b4b32b-4f47-4d89-919a-80746a1e7327';
const EMAIL = 'appstore-review@hanakai.kranz.design';
const OUT = `/tmp/nav-perf-${LABEL}.json`;

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
const env = { ...loadEnv(resolve(ROOT, '.env.local')), ...loadEnv(resolve(ROOT, '.env.secrets.local')), ...process.env };

function median(xs) {
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
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
  await Promise.race([
    page.waitForSelector('text=過去のイベント', { timeout: 90000 }),
    page.waitForSelector('text=まだ参加したイベントはありません', { timeout: 90000 }),
  ]);
}

async function measure(page, label, trigger) {
  const t0 = Date.now();
  await trigger();
  return { label, ms: Date.now() - t0, url: page.url() };
}

const browser = await chromium.launch({ headless: true });
const samples = {};

try {
  for (let run = 1; run <= RUNS; run++) {
    const context = await browser.newContext({ ...devices['iPhone 14'], locale: 'ja-JP' });
    const page = await context.newPage();
    console.log(`\n=== run ${run}/${RUNS} ===`);
    await loginMagic(page);

    // home → events (cold: first nav after home load)
    await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('text=WELCOME', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(run === 1 ? 500 : 1500); // warm allow prefetch
    const homeEvents = await measure(page, `home→events (${run === 1 ? 'cold' : 'warm'})`, async () => {
      await page.locator('a[href="/events"]').first().click();
      await page.waitForURL((u) => u.pathname === '/events' || u.pathname.startsWith('/events?'), { timeout: 60000 });
      await page.waitForSelector('text=カテゴリーから探す', { timeout: 60000 });
    });
    const heKey = run === 1 ? 'home→events cold' : 'home→events warm';
    (samples[heKey] ||= []).push(homeEvents.ms);
    console.log(heKey, homeEvents.ms);

    // connections → event
    await page.goto(`${BASE}/connections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await Promise.race([
    page.waitForSelector('text=過去のイベント', { timeout: 90000 }),
    page.waitForSelector('text=まだ参加したイベントはありません', { timeout: 90000 }),
  ]);
    if (run > 1) await page.waitForTimeout(1500);
    const connColdWarm = run === 1 ? 'cold' : 'warm';
    const a = await measure(page, `connections→event (${connColdWarm})`, async () => {
      await page.locator(`a[href="/connections/${COMMUNITY_ID}"]`).first().click();
      await page.waitForURL((u) => u.pathname.includes(`/connections/${COMMUNITY_ID}`), { timeout: 60000 });
      await page.waitForSelector('text=PARTICIPANTS', { timeout: 60000 });
    });
    const aKey = `connections→event ${connColdWarm}`;
    (samples[aKey] ||= []).push(a.ms);
    console.log(aKey, a.ms);

    if (run > 1) await page.waitForTimeout(800);
    const b = await measure(page, `participants→profile (${connColdWarm})`, async () => {
      await page.locator('a', { hasText: 'プロフィールを見る' }).first().click();
      await page.waitForURL((u) => u.pathname.startsWith('/profile/'), { timeout: 60000 });
      await page.waitForSelector('text=ブロックする', { timeout: 60000 });
    });
    const bKey = `participants→profile ${connColdWarm}`;
    (samples[bKey] ||= []).push(b.ms);
    console.log(bKey, b.ms);

    // home → my-profile
    await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(run === 1 ? 300 : 1200);
    const hp = await measure(page, `home→my-profile (${connColdWarm})`, async () => {
      await page.locator('a[href="/my-profile"]').first().click();
      await page.waitForURL((u) => u.pathname.startsWith('/my-profile'), { timeout: 60000 });
      await page.waitForSelector('text=本人確認', { timeout: 60000 });
    });
    const hpKey = `home→my-profile ${connColdWarm}`;
    (samples[hpKey] ||= []).push(hp.ms);
    console.log(hpKey, hp.ms);

    await context.close();
  }

  const summary = {
    ok: true,
    label: LABEL,
    base: BASE,
    runs: RUNS,
    medians: Object.fromEntries(
      Object.entries(samples).map(([k, xs]) => [k, { median: median(xs), samples: xs }]),
    ),
  };
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (e) {
  console.error('MEASURE_FATAL', e);
  writeFileSync(OUT, JSON.stringify({ ok: false, error: String(e), samples }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
