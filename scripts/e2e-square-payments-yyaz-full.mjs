#!/usr/bin/env node
/**
 * HANAKAI Square participation-fee FULL E2E on Preview yyaz (host-driven flow).
 * Covers: real event-create API + UI event create, apply, host participant
 * selection, payment_processing / not_selected / confirmed / payment_failed /
 * payment_expired, signed+unsigned+invalid webhooks, cleanup.
 *
 * yyaz + Square SANDBOX only. Never touches Production (xuex) or live Square.
 * Usage: node scripts/e2e-square-payments-yyaz-full.mjs [previewBaseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHanakaiPreviewContext, isVercelPreviewHost } from './lib/vercel-preview-context.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'scripts/e2e-screenshots/square-payments-preview');
mkdirSync(outDir, { recursive: true });

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
    if (v) env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = {
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(path.join(root, '.env.preview.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
  ...loadEnv(path.join(root, '.env.yyaz.secrets.local')),
  ...loadEnv(path.join(root, '.env.square.preview.local')),
};

const baseUrl = (process.argv[2] || process.env.HANAKAI_E2E_BASE || '').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
const webhookKey = env.SQUARE_WEBHOOK_SIGNATURE_KEY || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
const webhookUrl =
  env.SQUARE_WEBHOOK_NOTIFICATION_URL || process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || `${baseUrl}/api/webhooks/square`;
const cronSecret = env.CRON_SECRET || env.HANAKAI_CRON_SECRET || process.env.CRON_SECRET || '';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const tag = `sqy-${Date.now()}`;
const password = `E2eSq!${String(Date.now()).slice(-4)}`;

const results = [];
function record(id, ok, detail = '') {
  results.push({ id, ok: Boolean(ok), detail, at: new Date().toISOString() });
  console.log(ok ? 'PASS' : 'FAIL', id, detail);
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function assertYyaz(url) {
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing');
  if (url.includes('xuex')) throw new Error('Refusing xuex (production) Supabase URL');
  if (!url.includes('yyaz')) throw new Error('Supabase URL is not yyaz preview');
}

const state = { host: null, ok: null, notsel: null, fail: null, eventA: null, eventB: null, appOk: null, appNot: null, appFail: null, squarePaymentId: null, okCustomerId: null };

async function screenshot(page, name) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => null);
  return file;
}

async function login(page, email, nextPath = '/home') {
  await page.context().clearCookies(); // header-based Vercel bypass survives this
  await page.goto(`${baseUrl}/login?next=${encodeURIComponent(nextPath)}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (!(await page.locator('input[name="email"]').count())) return false;
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForNavigation({ timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
  await page.waitForTimeout(1500);
  return !page.url().includes('/login');
}

async function createMember(admin, { email, nickname }) {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nickname },
  });
  if (userErr || !userData.user) throw new Error(userErr?.message ?? 'auth create failed');
  const { data: member, error: memErr } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: userData.user.id, nickname, gender: 'female', area: '東京', age: 30,
      identity_verified: true, document_upload_status: 'approved', trust_verification_status: 'verified',
      terms_agreed_at: new Date().toISOString(), privacy_agreed_at: new Date().toISOString(),
      terms_version: '2026-07-16', privacy_version: '2026-07-08',
    })
    .select('id')
    .single();
  if (memErr || !member) throw new Error(memErr?.message ?? 'member create failed');
  return { email, memberId: member.id, authUserId: userData.user.id, nickname };
}

/** Seed an active saved-card row so the apply card-gate passes (Square not called). */
async function seedFakePaymentMethod(admin, member) {
  const custId = `cust_e2e_${member.memberId.slice(0, 8)}`;
  const cardId = `ccof:e2e-${member.memberId.slice(0, 8)}`;
  await admin.from('hanakai_square_customers').upsert(
    { member_id: member.memberId, square_customer_id: custId, environment: 'sandbox', updated_at: new Date().toISOString() },
    { onConflict: 'member_id,environment' },
  );
  await admin.from('hanakai_payment_methods').insert({
    member_id: member.memberId, square_customer_id: custId, square_card_id: cardId,
    brand: 'Visa', last_4: '1111', is_default: true, status: 'active', environment: 'sandbox',
    consent_version: 'e2e', consented_at: new Date().toISOString(),
  });
}

async function createEventViaApi(page, title) {
  const startAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const res = await page.request.post(`${baseUrl}/api/hanakai/events/create`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      title, category: 'flower', description: 'Square E2E real-API event with sufficient detail for the listing page.',
      startAt, area: '東京', venue: 'E2E API Venue', capacity: 3, fee: 0, conditions: 'E2E real API',
      approvalMode: 'host_approval', externalRecruitment: 'hanakai_only',
      venuePermissionConfirmed: true, venueFeeExplained: true, billingTarget: 'host',
    },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), eventId: json?.eventId ?? null, error: json?.error ?? null };
}

async function createEventViaUi(page, title) {
  await page.goto(`${baseUrl}/events/create`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1000);
  const d = new Date(Date.now() + 7 * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  const dtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('Square E2E UI-created event description with enough detail for display.');
  await page.locator('#startAt').fill(dtLocal);
  await page.locator('#area').fill('東京');
  await page.locator('#venue').fill('E2E UI Venue');
  await page.locator('#capacity').fill('3');
  await page.locator('#conditions').fill('E2E UI');
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i += 1) await checkboxes.nth(i).check().catch(() => null);
  await page.getByText('主催者承認', { exact: false }).first().click().catch(() => null);
  await page.getByRole('button', { name: 'この内容でイベントを公開する' }).click();
  // The success redirect appends ?created=1 — required so we don't match /events/create.
  await page.waitForURL(/\/events\/[^/?]+\?created=1/, { timeout: 90000 }).catch(() => null);
  const m = page.url().match(/\/events\/([^/?]+)/);
  return m && m[1] !== 'create' ? m[1] : null;
}

async function applyUi(page, admin, member, eventId, reason) {
  const ok = await login(page, member.email, `/events/${eventId}`);
  if (!ok) return { ok: false, reason: 'login_failed', appId: null };
  await page.goto(`${baseUrl}/events/${eventId}#event-apply`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1800);
  const reasonBox = page.locator('#reason');
  if (!(await reasonBox.count())) {
    const gate = (await page.locator('text=お支払い方法の登録').count()) > 0;
    return { ok: false, reason: gate ? 'card_gate_visible' : 'reason_input_missing', appId: null };
  }
  await reasonBox.fill(reason);
  await page.getByRole('button', { name: '参加申請する' }).click();
  // Ground-truth: poll for the created application row (server action + redirect).
  let appId = null;
  for (let i = 0; i < 8 && !appId; i += 1) {
    await page.waitForTimeout(1000);
    appId = await resolveAppId(admin, eventId, member.memberId);
  }
  return { ok: Boolean(appId), reason: appId ? undefined : 'application_not_created', appId };
}

async function hostSelect(page, eventId, selectNickname) {
  const ok = await login(page, state.host.email, `/events/manage/${eventId}`);
  if (!ok) return { ok: false, reason: 'host_login_failed' };
  await page.goto(`${baseUrl}/events/manage/${eventId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1800);
  const btn = page.getByRole('button', { name: new RegExp(`${escapeRegExp(selectNickname)}を(参加メンバーに追加|選択解除)`) });
  if (!(await btn.count())) return { ok: false, reason: 'applicant_button_not_found' };
  await btn.first().click();
  await page.getByRole('button', { name: 'このメンバーへ参加案内を送る' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'このメンバーで決定する' }).click();
  await page.waitForTimeout(7000); // server action awaits Square charge
  return { ok: true };
}

async function getApp(admin, appId) {
  const { data } = await admin.from('hanakai_event_applications').select('status, payment_deadline_at').eq('id', appId).maybeSingle();
  return data;
}
async function getPayment(admin, appId) {
  const { data } = await admin
    .from('hanakai_participation_payments')
    .select('id, status, square_payment_id, payment_deadline_at, environment')
    .eq('application_id', appId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}
async function resolveAppId(admin, eventId, memberId) {
  const { data } = await admin.from('hanakai_event_applications').select('id, member_id').eq('event_id', eventId);
  return data?.find((a) => a.member_id === memberId)?.id ?? null;
}

function signWebhook(rawBody, url, key) {
  return createHmac('sha256', key).update(url + rawBody).digest('base64');
}

async function cleanup(admin) {
  for (const eventId of [state.eventA, state.eventB].filter(Boolean)) {
    await admin.from('hanakai_participation_payments').delete().eq('event_id', eventId);
    await admin.from('hanakai_event_applications').delete().eq('event_id', eventId);
    await admin.from('hanakai_events').delete().eq('id', eventId);
  }
  await admin.from('hanakai_square_webhook_events').delete().like('square_event_id', `e2e-${tag}%`);
  for (const p of [state.host, state.ok, state.notsel, state.fail]) {
    if (!p) continue;
    await admin.from('hanakai_payment_methods').delete().eq('member_id', p.memberId);
    await admin.from('hanakai_payment_consents').delete().eq('member_id', p.memberId);
    await admin.from('hanakai_square_customers').delete().eq('member_id', p.memberId);
    await admin.from('hanakai_members').delete().eq('id', p.memberId);
    if (p.authUserId) await admin.auth.admin.deleteUser(p.authUserId);
  }
}
async function verifyCleanup(admin) {
  const checks = [];
  for (const eventId of [state.eventA, state.eventB].filter(Boolean)) {
    const { count } = await admin.from('hanakai_events').select('id', { head: true, count: 'exact' }).eq('id', eventId);
    checks.push(count === 0);
  }
  for (const p of [state.host, state.ok, state.notsel, state.fail]) {
    if (!p) continue;
    const { count } = await admin.from('hanakai_members').select('id', { head: true, count: 'exact' }).eq('id', p.memberId);
    checks.push(count === 0);
  }
  return checks.every(Boolean);
}

const report = {
  stamp, tag, baseUrl,
  gitSha: execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim(),
  results: [], pass: false,
};

let browser;
try {
  assertYyaz(supabaseUrl);
  if (!serviceRole) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing for yyaz');
  if (!baseUrl) throw new Error('previewBaseUrl arg required');
  record('env_supabase_yyaz', supabaseUrl.includes('yyaz') && !supabaseUrl.includes('xuex'), 'yyaz only');
  record('env_webhook_key_local', Boolean(webhookKey), webhookKey ? 'signature key present' : 'missing');

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  state.host = await createMember(admin, { email: `${tag}-host@test.hanakai.local`, nickname: `${tag} Host` });
  state.ok = await createMember(admin, { email: `${tag}-ok@test.hanakai.local`, nickname: `${tag} OK` });
  state.notsel = await createMember(admin, { email: `${tag}-ns@test.hanakai.local`, nickname: `${tag} NS` });
  state.fail = await createMember(admin, { email: `${tag}-ng@test.hanakai.local`, nickname: `${tag} NG` });
  record('seed_members', true, 'host + ok + notselected + fail');

  // Seed card-gate payment methods: notselected + fail are fake (fail declines at charge).
  await seedFakePaymentMethod(admin, state.notsel);
  await seedFakePaymentMethod(admin, state.fail);

  browser = await chromium.launch({ headless: true });
  const { context, useBypass } = await createHanakaiPreviewContext(browser, baseUrl, env);
  const page = await context.newPage();
  record('preview_bypass', !isVercelPreviewHost(baseUrl) || useBypass, useBypass ? 'header bypass' : 'no bypass');

  // Track page-level JS errors and 5xx responses across the whole run.
  const pageErrors = [];
  const serverErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err?.message ?? err)));
  page.on('response', (res) => {
    if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
  });
  state.pageErrors = pageErrors;
  state.serverErrors = serverErrors;

  // Webhooks: signature key IS configured now → fail-closed with 401.
  const unsigned = await page.request.post(`${baseUrl}/api/webhooks/square`, { headers: { 'Content-Type': 'application/json' }, data: {} });
  record('webhook_unsigned_rejected', [401, 503].includes(unsigned.status()), `status=${unsigned.status()}`);
  const invalid = await page.request.post(`${baseUrl}/api/webhooks/square`, {
    headers: { 'Content-Type': 'application/json', 'x-square-hmacsha256-signature': 'invalid' },
    data: { event_id: `e2e-${tag}-invalid`, type: 'payment.updated' },
  });
  record('webhook_invalid_signature_rejected', [401, 503].includes(invalid.status()), `status=${invalid.status()}`);

  // Host session → real event-create API (item 7) + UI event create (item 8)
  const hostOk = await login(page, state.host.email, '/home');
  record('host_login', hostOk);
  const apiEv = await createEventViaApi(page, `${tag} Event A (API)`);
  state.eventA = apiEv.eventId;
  record('api_event_create', apiEv.status === 200 && Boolean(apiEv.eventId), `status=${apiEv.status} ${apiEv.eventId ?? apiEv.error ?? ''}`);
  await screenshot(page, 'A1-event-api');
  state.eventB = await createEventViaUi(page, `${tag} Event B (UI)`);
  record('ui_event_create', Boolean(state.eventB), state.eventB ?? page.url());
  await screenshot(page, 'A2-event-ui');

  // Register a REAL Square sandbox card for the success applicant via the app endpoint.
  const okLogin = await login(page, state.ok.email, '/home');
  record('ok_applicant_login', okLogin);
  const cardRes = await page.request.post(`${baseUrl}/api/hanakai/payments/card`, {
    headers: { 'Content-Type': 'application/json' },
    data: { sourceId: 'cnon:card-nonce-ok', consentAccepted: true, platform: 'web' },
  });
  const cardJson = await cardRes.json().catch(() => ({}));
  record('square_card_register', cardRes.status() === 200 && cardJson?.ok === true, `status=${cardRes.status()} ${cardJson?.error ?? cardJson?.paymentMethod?.last4 ?? ''}`);
  const { data: okCust } = await admin.from('hanakai_square_customers').select('square_customer_id').eq('member_id', state.ok.memberId).maybeSingle();
  state.okCustomerId = okCust?.square_customer_id ?? null;

  // Applications
  if (state.eventA) {
    const a1 = await applyUi(page, admin, state.ok, state.eventA, 'Success path — looking forward to joining this event.');
    state.appOk = a1.appId;
    record('ui_apply_success', a1.ok, a1.reason ?? 'applied');
    const a2 = await applyUi(page, admin, state.notsel, state.eventA, 'Not-selected path applicant for this event.');
    state.appNot = a2.appId;
    record('ui_apply_not_selected', a2.ok, a2.reason ?? 'applied');
  }
  if (state.eventB) {
    const a3 = await applyUi(page, admin, state.fail, state.eventB, 'Decline path — testing payment failure handling.');
    state.appFail = a3.appId;
    record('ui_apply_fail', a3.ok, a3.reason ?? 'applied');
  }

  // Host selection — Event A: select OK only → OK charged→confirmed, NS→not_selected
  if (state.eventA && state.appOk) {
    const sel = await hostSelect(page, state.eventA, state.ok.nickname);
    record('host_select_confirmed', sel.ok, sel.reason ?? 'submitted');
    await screenshot(page, 'B1-host-select-A');
    const okStatus = await getApp(admin, state.appOk);
    const okPay = await getPayment(admin, state.appOk);
    state.squarePaymentId = okPay?.square_payment_id ?? null;
    record('status_payment_processing_or_beyond', ['payment_processing', 'confirmed'].includes(okStatus?.status ?? ''), okStatus?.status ?? 'null');
    record('status_confirmed', okStatus?.status === 'confirmed', `app=${okStatus?.status} pay=${okPay?.status}`);
    record('payment_row_completed', okPay?.status === 'completed', okPay?.status ?? 'none');
    // 5-arg env-param RPC: Preview app must pass 'sandbox' → payment.environment.
    record('payment_env_sandbox', okPay?.environment === 'sandbox', okPay?.environment ?? 'none');
    if (state.appNot) {
      const nsStatus = await getApp(admin, state.appNot);
      record('status_not_selected', nsStatus?.status === 'not_selected', nsStatus?.status ?? 'null');
    }
  }

  // Host selection — Event B: select FAIL → charge declines → payment_failed
  if (state.eventB && state.appFail) {
    const sel = await hostSelect(page, state.eventB, state.fail.nickname);
    record('host_select_failed', sel.ok, sel.reason ?? 'submitted');
    await screenshot(page, 'B2-host-select-B');
    const failStatus = await getApp(admin, state.appFail);
    const failPay = await getPayment(admin, state.appFail);
    record('status_payment_failed', failStatus?.status === 'payment_failed', `app=${failStatus?.status} pay=${failPay?.status}`);

    // Expiry via cron
    if (failPay?.id) {
      await admin.from('hanakai_participation_payments').update({ payment_deadline_at: new Date(Date.now() - 3600000).toISOString() }).eq('id', failPay.id);
      if (cronSecret) {
        const cron = await page.request.post(`${baseUrl}/api/hanakai/cron/payment-expiry`, { headers: { Authorization: `Bearer ${cronSecret}` } });
        const cronJson = await cron.json().catch(() => ({}));
        record('cron_payment_expiry', cron.ok(), JSON.stringify(cronJson).slice(0, 160));
        const expStatus = await getApp(admin, state.appFail);
        record('status_payment_expired', expStatus?.status === 'payment_expired', expStatus?.status ?? 'null');
      } else {
        record('cron_payment_expiry', false, 'CRON_SECRET missing');
        record('status_payment_expired', false, 'skipped');
      }
    }
  }

  // Cron GET/POST auth (fail-closed). Preview has CRON_SECRET set, so a wrong
  // secret must be 401 and a correct Bearer must be 200 for BOTH verbs.
  {
    const getOk = await page.request.get(`${baseUrl}/api/hanakai/cron/payment-expiry`, {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    });
    record('cron_get_authorized', cronSecret ? getOk.ok() : [401, 503].includes(getOk.status()), `status=${getOk.status()}`);
    const badGet = await page.request.get(`${baseUrl}/api/hanakai/cron/payment-expiry`, {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    record('cron_bad_secret_rejected', [401, 503].includes(badGet.status()), `status=${badGet.status()}`);
    const badPost = await page.request.post(`${baseUrl}/api/hanakai/cron/payment-expiry`, {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    record('cron_post_bad_secret_rejected', [401, 503].includes(badPost.status()), `status=${badPost.status()}`);
  }

  // Signed webhook (payment.updated → COMPLETED) for the confirmed payment
  if (webhookKey && state.squarePaymentId) {
    const eventId = `e2e-${tag}-${Date.now()}`;
    const body = { event_id: eventId, type: 'payment.updated', data: { object: { payment: { id: state.squarePaymentId, status: 'COMPLETED' } } } };
    const raw = JSON.stringify(body);
    const res = await page.request.post(`${baseUrl}/api/webhooks/square`, {
      headers: { 'Content-Type': 'application/json', 'x-square-hmacsha256-signature': signWebhook(raw, webhookUrl, webhookKey) },
      data: body,
    });
    const rj = await res.json().catch(() => ({}));
    record('webhook_receive', res.status() === 200 && rj?.ok !== false, `status=${res.status()}`);
    const { data: whRow } = await admin.from('hanakai_square_webhook_events').select('status').eq('square_event_id', eventId).maybeSingle();
    record('webhook_persisted', ['processed', 'received'].includes(whRow?.status ?? ''), whRow?.status ?? 'none');
  } else {
    record('webhook_receive', false, webhookKey ? 'no square_payment_id' : 'no signature key');
    record('webhook_persisted', false, 'skipped');
  }

  // UI outcome verification
  if (state.eventA && state.ok) {
    await login(page, state.ok.email, `/events/${state.eventA}`);
    await page.goto(`${baseUrl}/events/${state.eventA}`, { waitUntil: 'domcontentloaded' });
    const st = state.appOk ? await getApp(admin, state.appOk) : null;
    record('ui_confirmed_visible', st?.status === 'confirmed', st?.status ?? 'null');
    await screenshot(page, 'C1-confirmed');
  }

  await browser.close();
  browser = null;

  // Best-effort: remove the real sandbox Square customer created for OK applicant.
  if (state.okCustomerId && !state.okCustomerId.startsWith('cust_e2e_')) {
    const token = env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN || '';
    await fetch(`https://connect.squareupsandbox.com/v2/customers/${state.okCustomerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Square-Version': '2024-12-18' },
    }).catch(() => null);
  }

  record('no_5xx', (state.serverErrors?.length ?? 0) === 0, `${state.serverErrors?.length ?? 0} 5xx`);
  record('no_pageerror', (state.pageErrors?.length ?? 0) === 0, `${state.pageErrors?.length ?? 0} pageerrors`);

  await cleanup(admin);
  const cleanupOk = await verifyCleanup(admin);
  record('cleanup', true, 'test data removed');
  record('cleanup_counts', cleanupOk, cleanupOk ? 'zero remaining rows' : 'residual rows detected');
} catch (e) {
  record('fatal', false, e instanceof Error ? e.message : String(e));
  if (browser) await browser.close().catch(() => null);
}

report.results = results;
const criticalIds = [
  'env_supabase_yyaz', 'seed_members',
  'webhook_unsigned_rejected', 'webhook_invalid_signature_rejected',
  'api_event_create', 'ui_event_create', 'square_card_register',
  'ui_apply_success', 'ui_apply_not_selected', 'ui_apply_fail',
  'host_select_confirmed', 'status_payment_processing_or_beyond', 'status_confirmed',
  'payment_env_sandbox',
  'status_not_selected', 'host_select_failed', 'status_payment_failed',
  'status_payment_expired', 'cron_get_authorized', 'cron_bad_secret_rejected', 'cron_post_bad_secret_rejected',
  'webhook_receive', 'webhook_persisted',
  'ui_confirmed_visible', 'no_5xx', 'no_pageerror', 'cleanup', 'cleanup_counts',
];
report.summary = { total: results.length, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
report.criticalFailed = criticalIds.filter((id) => results.find((r) => r.id === id)?.ok !== true);
report.pass = report.criticalFailed.length === 0;

const outPath = path.join(outDir, `${stamp}-yyaz-report.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
