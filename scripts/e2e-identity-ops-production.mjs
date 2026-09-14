#!/usr/bin/env node
/**
 * Production E2E: identity submit → admin approve → user verified.
 * Dummy PDF only (no PII). Uses IdentityE2E test member only.
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = (process.env.BASE_URL || 'https://hanakai.kranz.design').replace(/\/$/, '');
const DUMMY = process.env.IDENTITY_DUMMY_FILE || '/tmp/identity-dummy-doc.pdf';
const target = JSON.parse(readFileSync('/tmp/identity-e2e-target.json', 'utf8'));

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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = {};
const timings = {};

function pass(key, ok, detail) {
  results[key] = { ok: Boolean(ok), detail: String(detail) };
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}: ${detail}`);
}

async function readMember() {
  const { data, error } = await admin
    .from('hanakai_members')
    .select(
      'id, nickname, document_upload_status, identity_verified, trust_notes, trust_verification_status, safety_flags',
    )
    .eq('id', target.memberId)
    .single();
  if (error) throw error;
  return data;
}

async function resetMember() {
  await admin
    .from('hanakai_members')
    .update({
      document_upload_status: 'none',
      identity_verified: false,
      trust_notes: null,
      trust_verification_status: 'none',
      safety_flags: [],
    })
    .eq('id', target.memberId);
}

async function loginMagic(page, next = '/my-profile') {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: { redirectTo: `${BASE}${next}` },
  });
  if (error) throw error;
  const token = data.properties.hashed_token;
  await page.goto(
    `${BASE}/api/auth/callback?token_hash=${encodeURIComponent(token)}&type=magiclink&next=${encodeURIComponent(next)}`,
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  );
  await page.waitForURL((u) => !u.pathname.includes('/api/auth'), { timeout: 90000 });
}

async function openProfile(page) {
  await page.goto(`${BASE}/my-profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 14'], locale: 'ja-JP' });
const page = await context.newPage();

try {
  await resetMember();
  const pre = await readMember();
  pass('precondition_none', pre.document_upload_status === 'none' && !pre.identity_verified, `doc=${pre.document_upload_status}`);

  await loginMagic(page);
  await openProfile(page);
  let text = await page.locator('body').innerText();
  pass('status_unsubmitted', text.includes('未提出'), 'unsubmitted visible');
  pass('no_guest', !text.includes('ゲストさん') && text.includes('IdentityE2E'), 'nickname');

  const fileInput = page.locator('input[type="file"][name="identityDocument"]');
  await fileInput.waitFor({ state: 'attached', timeout: 30000 });

  const tSelect = Date.now();
  await fileInput.setInputFiles({
    name: 'identity-dummy-doc.pdf',
    mimeType: 'application/pdf',
    buffer: readFileSync(DUMMY),
  });
  const submitBtn = page.getByRole('button', { name: /本人確認書類を提出/ });
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      (x.textContent || '').includes('本人確認書類を提出'),
    );
    return Boolean(b && !b.disabled);
  }, null, { timeout: 30000 });
  timings.select_to_ready_ms = Date.now() - tSelect;

  let sawSending = false;
  const tUpload = Date.now();
  const loadingPromise = page
    .getByText(/送信しています|書類を準備|反映しています|送信中/)
    .first()
    .waitFor({ timeout: 15000 })
    .then(() => {
      sawSending = true;
      timings.loading_ui_ms = Date.now() - tUpload;
    })
    .catch(() => {});

  await submitBtn.click();
  await loadingPromise;

  await page.waitForURL((u) => u.search.includes('identity=submitted') || u.search.includes('error='), {
    timeout: 180000,
  }).catch(() => {});
  timings.upload_complete_ms = Date.now() - tUpload;

  await page.waitForSelector('text=本人確認', { timeout: 60000 });
  text = await page.locator('body').innerText();
  const redirectOk = page.url().includes('identity=submitted');
  pass('upload_redirect', redirectOk, `url_has_submitted=${redirectOk}`);
  pass('sending_ui', sawSending, `loading_ui_ms=${timings.loading_ui_ms ?? 'n/a'}`);
  pass(
    'status_pending_ui',
    text.includes('運営') && (text.includes('確認') || text.includes('受け付け')),
    'pending copy',
  );
  pass('upload_ui_hidden', (await fileInput.count()) === 0, 'no re-upload');

  let pending = false;
  for (let i = 0; i < 40; i++) {
    const m = await readMember();
    if (m.document_upload_status === 'pending') {
      pending = true;
      timings.db_pending_ms = Date.now() - tUpload;
      pass('db_pending', true, `trust_notes_prefix=${String(m.trust_notes || '').startsWith('identity:')}`);
      break;
    }
    await page.waitForTimeout(250);
  }
  if (!pending) {
    const m = await readMember();
    pass('db_pending', false, `doc=${m.document_upload_status}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
  text = await page.locator('body').innerText();
  pass('reload_pending', text.includes('確認') && (await page.locator('input[name="identityDocument"]').count()) === 0, 'persisted');

  // Admin approve via service_role (same path as admin UI actions)
  const tApprove = Date.now();
  const mBefore = await readMember();
  const { error: approveErr } = await admin
    .from('hanakai_members')
    .update({
      identity_verified: true,
      document_upload_status: 'approved',
      trust_verification_status: 'verified',
      safety_flags: [],
      identity_verification_date: new Date().toISOString(),
      trust_notes: `${mBefore.trust_notes || ''}\n[承認] E2E auto-approve`.trim(),
    })
    .eq('id', target.memberId);
  pass('admin_approve_db', !approveErr, approveErr?.message || 'approved');
  timings.admin_approve_ms = Date.now() - tApprove;

  // Insert review log if table exists
  await admin.from('hanakai_identity_review_logs').insert({
    member_id: target.memberId,
    reviewer_member_id: target.memberId,
    action: 'approved',
    note: 'E2E auto-approve',
    document_ref: String(mBefore.trust_notes || '').replace(/^identity:/, '') || null,
  }).then(() => {}).catch(() => {});

  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await openProfile(page);
  text = await page.locator('body').innerText();
  const mApproved = await readMember();
  pass('user_verified_ui', text.includes('本人確認済み') || text.includes('本人確認が完了'), 'verified copy');
  pass('user_verified_db', mApproved.identity_verified === true && mApproved.document_upload_status === 'approved', `verified=${mApproved.identity_verified}`);
  pass('verified_badge', text.includes('本人確認済み'), 'badge/text');

  await page.context().clearCookies();
  await loginMagic(page);
  await openProfile(page);
  text = await page.locator('body').innerText();
  const mRelogin = await readMember();
  pass('relogin_verified_ui', text.includes('本人確認済み') || text.includes('本人確認が完了'), 'after relogin');
  pass('relogin_verified_db', mRelogin.identity_verified === true, `verified=${mRelogin.identity_verified}`);
  pass('no_guest_after', !text.includes('ゲストさん'), 'no guest');

  timings.total_ms = (timings.select_to_ready_ms || 0) + (timings.upload_complete_ms || 0);
  const failed = Object.values(results).some((r) => !r.ok);
  const summary = { ok: !failed, results, timings, base: BASE };
  writeFileSync('/tmp/identity-ops-e2e-result.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = failed ? 1 : 0;
} catch (e) {
  console.error('E2E_FATAL', e instanceof Error ? e.message : String(e));
  writeFileSync(
    '/tmp/identity-ops-e2e-result.json',
    JSON.stringify({ ok: false, fatal: String(e), results, timings }, null, 2),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
