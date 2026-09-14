#!/usr/bin/env node
/**
 * Production E2E: identity document submit persistence (test-only user).
 * Uses dummy PDF (no PII). Does not mutate other users' identity state.
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'https://hanakai.kranz.design';
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
const httpMeta = [];

function pass(key, ok, detail) {
  results[key] = { ok: Boolean(ok), detail: String(detail) };
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}: ${detail}`);
}

async function readMember() {
  const { data, error } = await admin
    .from('hanakai_members')
    .select('id, nickname, document_upload_status, identity_verified, trust_notes, trust_verification_status')
    .eq('id', target.memberId)
    .single();
  if (error) throw error;
  return data;
}

async function loginMagic(page) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
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

async function openProfile(page) {
  await page.goto(`${BASE}/my-profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
}

async function doLogout(page) {
  await openProfile(page);
  const headerButtons = page.locator('header button');
  const count = await headerButtons.count();
  for (let i = 0; i < count; i++) {
    await headerButtons.nth(i).click({ timeout: 1500 }).catch(() => {});
    if (await page.getByRole('button', { name: 'ログアウト' }).count()) break;
  }
  const logoutBtn = page.getByRole('button', { name: 'ログアウト' });
  if (await logoutBtn.count()) {
    await Promise.all([
      page.waitForURL((u) => u.pathname.includes('/login') || u.pathname === '/', { timeout: 60000 }).catch(() => {}),
      logoutBtn.first().click(),
    ]);
    await page.waitForTimeout(800);
    return;
  }
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 14'], locale: 'ja-JP' });
const page = await context.newPage();

page.on('response', (res) => {
  try {
    const url = res.url();
    if (!url.includes('hanakai.kranz.design')) return;
    const method = res.request().method();
    if (method === 'POST' || res.status() >= 400) {
      httpMeta.push({
        status: res.status(),
        method,
        path: new URL(url).pathname,
      });
    }
  } catch {
    /* ignore */
  }
});

try {
  const before = await readMember();
  if (before.document_upload_status !== 'none') {
    await admin
      .from('hanakai_members')
      .update({
        document_upload_status: 'none',
        identity_verified: false,
        trust_notes: null,
        trust_verification_status: 'none',
      })
      .eq('id', target.memberId);
  }
  const pre = await readMember();
  pass('precondition_none', pre.document_upload_status === 'none', `doc=${pre.document_upload_status}`);

  await loginMagic(page);
  await openProfile(page);
  let text = await page.locator('body').innerText();
  pass('open_identity', text.includes('本人確認'), `url=${page.url()}`);
  pass('unsubmitted_ui', text.includes('本人確認書類が未提出です'), 'unsubmitted label');
  pass('no_guest_on_profile', !text.includes('ゲストさん') && text.includes('IdentityE2E'), 'nickname shown');

  const fileInput = page.locator('input[type="file"][name="identityDocument"]');
  await fileInput.waitFor({ state: 'attached', timeout: 30000 });

  const tSelect0 = Date.now();
  await fileInput.setInputFiles({
    name: 'identity-dummy-doc.pdf',
    mimeType: 'application/pdf',
    buffer: readFileSync(DUMMY),
  });
  const submitBtn = page.getByRole('button', { name: '本人確認書類を提出する' });
  await submitBtn.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll('button')];
    const b = buttons.find((x) => (x.textContent || '').includes('本人確認書類を提出する'));
    return Boolean(b && !b.disabled);
  }, null, { timeout: 30000 });
  timings.select_to_submit_start_ms = Date.now() - tSelect0;
  pass('file_selected', true, `select_to_submit_start_ms=${timings.select_to_submit_start_ms}`);

  const tUpload0 = Date.now();
  let sawLoading = false;
  const loadingPromise = page
    .getByText(/送信中|書類を準備|審査登録/)
    .first()
    .waitFor({ timeout: 30000 })
    .then(() => {
      sawLoading = true;
      timings.loading_ui_ms = Date.now() - tUpload0;
    })
    .catch(() => {});

  // Poll DB for pending while upload runs
  let dbPendingSeen = false;
  const dbPoll = (async () => {
    for (let i = 0; i < 120; i++) {
      const m = await readMember();
      if (m.document_upload_status === 'pending') {
        dbPendingSeen = true;
        timings.db_pending_ms = Date.now() - tUpload0;
        return m;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    return readMember();
  })();

  await submitBtn.click();
  await loadingPromise;

  await page
    .waitForURL(
      (u) =>
        u.pathname.includes('/my-profile') &&
        (u.search.includes('identity=submitted') || u.search.includes('error=')),
      { timeout: 180000 },
    )
    .catch(() => {});
  const postSubmitUrl = page.url();
  const actionError = new URL(postSubmitUrl).searchParams.get('error');
  const actionIdentity = new URL(postSubmitUrl).searchParams.get('identity');
  pass(
    'server_action_redirect',
    actionIdentity === 'submitted' && !actionError,
    `identity=${actionIdentity}; error=${actionError}; http_posts=${httpMeta.filter((h) => h.method === 'POST' && h.path === '/my-profile').map((h) => h.status).join(',')}`,
  );
  await page.waitForSelector('text=本人確認書類を受け付けました', { timeout: 60000 }).catch(() => {});
  timings.upload_complete_ms = Date.now() - tUpload0;

  // Ensure profile body settled
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
  text = await page.locator('body').innerText();
  const successOk =
    text.includes('本人確認書類を受け付けました') || text.includes('本人確認書類を提出済みです');
  pass('loading_ui', sawLoading, `loading_ui_ms=${timings.loading_ui_ms ?? 'n/a'}`);
  pass('upload_success', successOk, text.includes('本人確認書類を受け付けました') ? 'success banner' : 'pending label only');
  pass('pending_label_after_submit', text.includes('本人確認書類を提出済みです'), 'pending label');
  pass('no_guest_after_submit', !text.includes('ゲストさん'), 'no guest');

  const mPending = await dbPoll;
  const hasRef = String(mPending.trust_notes || '').startsWith('identity:');
  pass(
    'db_pending',
    dbPendingSeen && mPending.document_upload_status === 'pending',
    `doc=${mPending.document_upload_status}; identityRef=${hasRef}; db_pending_ms=${timings.db_pending_ms ?? 'n/a'}`,
  );

  await openProfile(page);
  text = await page.locator('body').innerText();
  let fileCount = await page.locator('input[type="file"][name="identityDocument"]').count();
  let submitCount = await page.getByRole('button', { name: '本人確認書類を提出する' }).count();
  timings.ui_pending_switch_ms = Date.now() - tUpload0;
  pass('pending_ui', text.includes('本人確認書類を提出済みです'), 'pending label');
  pass('pending_hides_upload', fileCount === 0 && submitCount === 0, `file=${fileCount} submit=${submitCount}`);
  pass('pending_blocks_resubmit_copy', text.includes('追加の書類提出はできません'), 'resubmit blocked');

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
  text = await page.locator('body').innerText();
  fileCount = await page.locator('input[type="file"][name="identityDocument"]').count();
  pass('reload_pending', text.includes('本人確認書類を提出済みです') && fileCount === 0, `file=${fileCount}`);

  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const homeText = await page.locator('body').innerText();
  pass('no_guest_on_home', !homeText.includes('ゲストさん'), `guest=${homeText.includes('ゲストさん')}`);
  pass('home_shows_name_or_welcome', homeText.includes('IdentityE2E') || homeText.includes('ようこそ'), 'greeting');
  await openProfile(page);
  text = await page.locator('body').innerText();
  pass('nav_back_pending', text.includes('本人確認書類を提出済みです'), 'pending after nav');

  await doLogout(page);
  await loginMagic(page);
  await openProfile(page);
  text = await page.locator('body').innerText();
  fileCount = await page.locator('input[type="file"][name="identityDocument"]').count();
  const mRelogin = await readMember();
  pass('relogin_pending_ui', text.includes('本人確認書類を提出済みです') && fileCount === 0, `file=${fileCount}`);
  pass('relogin_db_pending', mRelogin.document_upload_status === 'pending', `doc=${mRelogin.document_upload_status}`);
  pass('no_guest_after_relogin', !text.includes('ゲストさん'), 'no guest after relogin');
  pass('double_submit_prevented', fileCount === 0, 'upload UI absent');

  timings.total_ms =
    (timings.select_to_submit_start_ms || 0) + (timings.upload_complete_ms || 0);

  const stepEntries = Object.entries({
    select_to_submit_start_ms: timings.select_to_submit_start_ms,
    loading_ui_ms: timings.loading_ui_ms,
    upload_complete_ms: timings.upload_complete_ms,
    db_pending_ms: timings.db_pending_ms,
    ui_pending_switch_ms: timings.ui_pending_switch_ms,
  }).filter(([, v]) => typeof v === 'number');
  stepEntries.sort((a, b) => b[1] - a[1]);
  const longest = stepEntries[0] || null;

  const failed = Object.values(results).some((r) => !r.ok);
  const summary = {
    ok: !failed,
    results,
    timings,
    longest_step: longest ? { name: longest[0], ms: longest[1] } : null,
    http_post_or_error: httpMeta.filter((h) => h.method === 'POST' || h.status >= 400).slice(0, 40),
  };
  writeFileSync('/tmp/identity-e2e-result.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = failed ? 1 : 0;
} catch (e) {
  const m = await readMember().catch(() => null);
  console.error('E2E_FATAL', e instanceof Error ? e.message : String(e));
  const summary = {
    ok: false,
    fatal: e instanceof Error ? e.message : String(e),
    results,
    timings,
    memberDoc: m?.document_upload_status ?? null,
    http_post_or_error: httpMeta.filter((h) => h.method === 'POST' || h.status >= 400).slice(-20),
  };
  writeFileSync('/tmp/identity-e2e-result.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
