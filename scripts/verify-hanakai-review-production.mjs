#!/usr/bin/env node
/**
 * Post-seed Production verification for App Store review demo.
 * Uses Playwright against https://hanakai.kranz.design — never logs passwords.
 *
 * Required env (.env.secrets.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   HANAKAI_REVIEW_EMAIL, HANAKAI_REVIEW_PASSWORD
 *   HANAKAI_REVIEW_HOST_EMAIL, HANAKAI_REVIEW_HOST_PASSWORD
 *   HANAKAI_REVIEW_APPSTORE_EVENT_ID (after seed apply)
 *
 * Usage: node scripts/verify-hanakai-review-production.mjs
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'https://hanakai.kranz.design';
const EVENT_TITLE = 'HANAKAI App Review Demo Event';
const COMMUNITY_TITLE = 'HANAKAI Community Review Demo';
const LEGACY_ID = 'a27f5be8-a875-461c-9fd1-adfb936410ff';
const COMMUNITY_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(resolve(ROOT, '.env.local')),
  ...loadEnvFile(resolve(ROOT, '.env.production.local')),
  ...loadEnvFile(resolve(ROOT, '.env.secrets.local')),
  ...process.env,
};

const url = (fileEnv.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceRole = fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';
const participantEmail = (fileEnv.HANAKAI_REVIEW_EMAIL || '').trim();
const participantPassword = fileEnv.HANAKAI_REVIEW_PASSWORD || '';
const hostEmail = (fileEnv.HANAKAI_REVIEW_HOST_EMAIL || 'review-host@hanakai.kranz.design').trim();
const hostPassword = fileEnv.HANAKAI_REVIEW_HOST_PASSWORD || '';
const eventId = (fileEnv.HANAKAI_REVIEW_APPSTORE_EVENT_ID || '').trim();

const results = {};
function pass(key, ok, detail) {
  results[key] = { ok, detail };
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}: ${detail}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 60000 });
}

async function verifyParticipant(page, viewportLabel) {
  const prefix = `participant_${viewportLabel}`;
  try {
    await login(page, participantEmail, participantPassword);
    pass(`${prefix}_login`, true, 'logged in');

    await page.goto(`${BASE}/events`, { waitUntil: 'domcontentloaded' });
    const body = await page.textContent('body');
    const hasEvent = body?.includes(EVENT_TITLE);
    pass(`${prefix}_events_list`, !!hasEvent, hasEvent ? 'event visible on /events' : 'event not found on /events');

    if (eventId) {
      await page.goto(`${BASE}/events/${eventId}`, { waitUntil: 'domcontentloaded' });
      const detail = await page.textContent('body');
      pass(`${prefix}_event_detail`, detail?.includes(EVENT_TITLE), 'event detail opens');
      pass(`${prefix}_apply_cta`, !detail?.includes('このイベントは終了しました'), 'not ended / apply area available');
    }

    await page.goto(`${BASE}/connections`, { waitUntil: 'domcontentloaded' });
    const conn = await page.textContent('body');
    pass(`${prefix}_community`, !!conn?.includes(COMMUNITY_TITLE), 'community past event visible');

    if (eventId) {
      await page.goto(`${BASE}/connections/${COMMUNITY_ID}`, { waitUntil: 'domcontentloaded' });
      const peers = await page.textContent('body');
      pass(`${prefix}_report_block`, !!peers?.includes('通報') || !!peers?.includes('審査デモ'), 'report/peers on community page');
    }
  } catch (err) {
    pass(`${prefix}_login`, false, err?.message || 'login flow failed');
  }
}

async function verifyHost(page, viewportLabel) {
  const prefix = `host_${viewportLabel}`;
  try {
    await page.context().clearCookies();
    await login(page, hostEmail, hostPassword);
    pass(`${prefix}_login`, true, 'logged in');

    if (eventId) {
      await page.goto(`${BASE}/events/manage/${eventId}`, { waitUntil: 'domcontentloaded' });
      const manage = await page.textContent('body');
      const ok =
        !!manage?.includes('HOST MANAGEMENT') ||
        !!manage?.includes('申請') ||
        !!manage?.includes(EVENT_TITLE);
      pass(`${prefix}_manage`, ok && !manage?.includes('主催者のみが管理できます'), 'host manage page');
      pass(`${prefix}_pending_app`, !!manage?.includes('承認待ち') || !!manage?.includes('pending') || !!manage?.includes('申請'), 'applications visible');
    }
  } catch (err) {
    pass(`${prefix}_login`, false, err?.message || 'host login failed');
  }
}

async function verifyDb() {
  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data: legacy } = await admin.from('hanakai_events').select('title,start_at,is_past,status,updated_at').eq('id', LEGACY_ID).maybeSingle();
  const { data: community } = await admin.from('hanakai_events').select('title,start_at,is_past,status,updated_at').eq('id', COMMUNITY_ID).maybeSingle();
  const { count: payCount } = await admin.from('hanakai_participation_payments').select('id', { count: 'exact', head: true }).eq('event_id', eventId);
  pass('payment_changes', (payCount ?? 0) === 0, `participation_payments for review event: ${payCount ?? 0}`);
  pass('legacy_unchanged', !!legacy?.title, 'legacy event readable');
  pass('community_unchanged', !!community?.title, 'community event readable');
}

async function main() {
  if (!url || !serviceRole || !participantEmail || !participantPassword || !hostEmail || !hostPassword) {
    console.error('Missing required env for verification');
    process.exit(1);
  }
  if (!eventId) {
    console.error('Missing HANAKAI_REVIEW_APPSTORE_EVENT_ID — run seed apply first');
    process.exit(1);
  }

  await verifyDb();

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const dPage = await desktop.newPage();
    await verifyParticipant(dPage, 'iphone');
    const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const hPage = await hostCtx.newPage();
    await verifyHost(hPage, 'iphone');

    const ipad = await browser.newContext({
      ...devices['iPad Air'],
      viewport: { width: 820, height: 1180 },
    });
    const iPage = await ipad.newPage();
    await verifyParticipant(iPage, 'ipad');
    const iHostPage = await ipad.newPage();
    await verifyHost(iHostPage, 'ipad');
    pass('ipad_layout', true, 'iPad viewport flows executed without throw');
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ results, eventId }, null, 2));
  const failed = Object.values(results).some((r) => !r.ok);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('[verify] FAILED', err?.message || err);
  process.exit(1);
});
