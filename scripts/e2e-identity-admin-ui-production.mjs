#!/usr/bin/env node
/**
 * Production Admin UI E2E — real admin console clicks (not DB shortcuts).
 *
 * Flow:
 *   test user submit → admin login → pending list → signed doc view
 *   → click 「承認（本人確認済み）」 → success flash
 *   → user profile verified → reload → logout/login → still verified
 *   → admin 「再提出依頼」 → user sees resubmission copy
 *
 * Dummy PDF only. Never logs signed URLs or document contents.
 */
import { chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = (process.env.BASE_URL || 'https://hanakai.kranz.design').replace(/\/$/, '');
const DUMMY = process.env.IDENTITY_DUMMY_FILE || '/tmp/identity-dummy-doc.pdf';
const OUT = '/tmp/identity-admin-ui-e2e-result.json';
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

const adminEmail = env.HANAKAI_ADMIN_EMAIL;
const adminPassword = env.HANAKAI_ADMIN_PASSWORD;

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = {};
const timings = {};

function pass(key, ok, detail = '') {
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

async function resetMember(patch = {}) {
  const { error } = await admin
    .from('hanakai_members')
    .update({
      document_upload_status: 'none',
      identity_verified: false,
      trust_notes: null,
      trust_verification_status: 'none',
      safety_flags: [],
      ...patch,
    })
    .eq('id', target.memberId);
  if (error) throw error;
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

async function loginAdmin(page) {
  const next = '/admin/hanakai/identity-reviews';
  await page.goto(`${BASE}/login?next=${encodeURIComponent(next)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page
    .waitForURL((url) => !url.pathname.includes('/login') || url.search.includes('error='), {
      timeout: 90000,
    })
    .catch(() => null);
  if (page.url().includes('/login')) return false;
  await page.goto(`${BASE}${next}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('text=本人確認審査', { timeout: 60000 });
  return true;
}

async function openProfile(page) {
  await page.goto(`${BASE}/my-profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=本人確認', { timeout: 60000 });
}

async function submitIdentity(page) {
  const fileInput = page.locator('input[type="file"][name="identityDocument"]');
  await fileInput.waitFor({ state: 'attached', timeout: 30000 });
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

  const t0 = Date.now();
  await submitBtn.click();
  await page
    .waitForURL((u) => u.search.includes('identity=submitted') || u.search.includes('error='), {
      timeout: 180000,
    })
    .catch(() => {});
  timings.submit_ms = Date.now() - t0;

  for (let i = 0; i < 40; i++) {
    const m = await readMember();
    if (m.document_upload_status === 'pending') {
      timings.db_pending_ms = Date.now() - t0;
      return true;
    }
    await page.waitForTimeout(250);
  }
  return false;
}

function targetSection(page) {
  return page.locator('section').filter({ hasText: target.nickname }).first();
}

const browser = await chromium.launch({ headless: true });
const userCtx = await browser.newContext({ ...devices['iPhone 14'], locale: 'ja-JP' });
const adminCtx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'ja-JP',
});
const userPage = await userCtx.newPage();
const adminPage = await adminCtx.newPage();

try {
  if (!adminEmail || !adminPassword) throw new Error('HANAKAI_ADMIN_EMAIL/PASSWORD missing');
  if (!existsSync(DUMMY)) throw new Error(`dummy missing: ${DUMMY}`);

  await resetMember();
  const pre = await readMember();
  pass(
    'precondition_none',
    pre.document_upload_status === 'none' && !pre.identity_verified,
    `doc=${pre.document_upload_status}`,
  );

  await loginMagic(userPage);
  await openProfile(userPage);
  const pendingOk = await submitIdentity(userPage);
  pass('user_submit_pending', pendingOk, `pending=${pendingOk}`);

  const adminOk = await loginAdmin(adminPage);
  pass('admin_login', adminOk, adminPage.url());

  let body = await adminPage.locator('body').innerText();
  const listOk =
    body.includes(target.nickname) && !body.includes('審査待ちの本人確認申請はありません');
  pass('pending_list', listOk, listOk ? 'target visible' : 'missing from list');

  const section = targetSection(adminPage);
  await section.waitFor({ state: 'visible', timeout: 30000 });

  const docImg = section.locator('img[alt="本人確認書類"]');
  const imgCount = await docImg.count();
  let signedOk = false;
  if (imgCount > 0) {
    const src = await docImg.first().getAttribute('src');
    signedOk = Boolean(src && src.includes('token='));
    await docImg
      .first()
      .evaluate(
        (img) =>
          img.complete ||
          new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            setTimeout(() => resolve(img.complete), 8000);
          }),
      )
      .catch(() => false);
  }
  pass('doc_view_signed', signedOk, `img_count=${imgCount}`);

  const memberLink = section.locator(`a[href="/admin/hanakai/members/${target.memberId}"]`).first();
  if (await memberLink.count()) {
    await memberLink.click();
    await adminPage.waitForURL((u) => u.pathname.includes(`/admin/hanakai/members/${target.memberId}`), {
      timeout: 60000,
    });
    pass('open_member', true, 'member detail');
    await adminPage.goto(`${BASE}/admin/hanakai/identity-reviews`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await adminPage.waitForSelector('text=本人確認審査', { timeout: 60000 });
  } else {
    pass('open_member', false, 'member link missing');
  }

  const section2 = targetSection(adminPage);
  const approveForm = section2.locator('form').filter({
    has: adminPage.getByRole('button', { name: '承認（本人確認済み）' }),
  });
  await approveForm.locator('textarea[name="note"]').fill('E2E Admin UI approve (dummy)');
  const tApprove = Date.now();
  await Promise.all([
    adminPage
      .waitForURL((u) => u.search.includes('success=identity_approved'), { timeout: 90000 })
      .catch(() => null),
    approveForm.getByRole('button', { name: '承認（本人確認済み）' }).click(),
  ]);
  timings.admin_approve_ui_ms = Date.now() - tApprove;
  body = await adminPage.locator('body').innerText();
  const approveUi =
    body.includes('本人確認を承認しました') || adminPage.url().includes('success=identity_approved');
  pass('ui_approve', approveUi, approveUi ? 'flash/url ok' : 'no success flash');

  const mApproved = await readMember();
  pass(
    'db_verified_after_ui',
    mApproved.identity_verified === true && mApproved.document_upload_status === 'approved',
    `verified=${mApproved.identity_verified} doc=${mApproved.document_upload_status}`,
  );

  await openProfile(userPage);
  let userText = await userPage.locator('body').innerText();
  pass(
    'user_verified_ui',
    userText.includes('本人確認済み') || userText.includes('本人確認が完了'),
    'verified copy',
  );

  await userPage.reload({ waitUntil: 'domcontentloaded' });
  await userPage.waitForSelector('text=本人確認', { timeout: 60000 });
  userText = await userPage.locator('body').innerText();
  pass(
    'user_verified_reload',
    userText.includes('本人確認済み') || userText.includes('本人確認が完了'),
    'reload',
  );

  await userCtx.clearCookies();
  await loginMagic(userPage);
  await openProfile(userPage);
  userText = await userPage.locator('body').innerText();
  const mRelogin = await readMember();
  pass(
    'relogin_verified',
    (userText.includes('本人確認済み') || userText.includes('本人確認が完了')) &&
      mRelogin.identity_verified === true,
    'after logout/login',
  );

  // Put back to pending for resubmit UI (keep identity: document ref)
  const trustKeep =
    String(mApproved.trust_notes || '')
      .split('\n')
      .find((l) => l.startsWith('identity:')) || 'identity:e2e-dummy-ref';
  await resetMember({
    document_upload_status: 'pending',
    identity_verified: false,
    trust_verification_status: 'reviewing',
    trust_notes: trustKeep,
    safety_flags: [],
  });

  await adminPage.goto(`${BASE}/admin/hanakai/identity-reviews`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await adminPage.waitForSelector('text=本人確認審査', { timeout: 60000 });
  const section3 = targetSection(adminPage);
  const resubmitForm = section3.locator('form').filter({
    has: adminPage.getByRole('button', { name: '再提出依頼' }),
  });
  let resubmitUi = false;
  if (await resubmitForm.count()) {
    await resubmitForm.locator('textarea[name="note"]').fill('E2E再提出依頼（ダミー）');
    await Promise.all([
      adminPage
        .waitForURL((u) => u.search.includes('success=resubmit_requested'), { timeout: 90000 })
        .catch(() => null),
      resubmitForm.getByRole('button', { name: '再提出依頼' }).click(),
    ]);
    body = await adminPage.locator('body').innerText();
    resubmitUi =
      body.includes('本人確認の再提出を依頼しました') ||
      adminPage.url().includes('success=resubmit_requested');
  }
  pass('resubmit_ui', resubmitUi, resubmitUi ? 'admin flash ok' : 'failed');

  await openProfile(userPage);
  userText = await userPage.locator('body').innerText();
  const resubmitUser =
    userText.includes('再提出') ||
    userText.includes('確認できなかった') ||
    userText.includes('再度ご提出');
  pass('resubmit_user_ui', resubmitUser, 'user resubmission copy');

  const failed = Object.values(results).some((r) => !r.ok);
  const summary = {
    ok: !failed,
    base: BASE,
    results,
    timings,
    report: {
      pending_list: results.pending_list?.ok ? 'PASS' : 'FAIL',
      doc_view: results.doc_view_signed?.ok ? 'PASS' : 'FAIL',
      ui_approve: results.ui_approve?.ok ? 'PASS' : 'FAIL',
      user_verified:
        results.user_verified_ui?.ok && results.user_verified_reload?.ok ? 'PASS' : 'FAIL',
      relogin: results.relogin_verified?.ok ? 'PASS' : 'FAIL',
      resubmit_ui: results.resubmit_ui?.ok && results.resubmit_user_ui?.ok ? 'PASS' : 'FAIL',
    },
  };
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = failed ? 1 : 0;
} catch (e) {
  console.error('E2E_FATAL', e instanceof Error ? e.message : String(e));
  writeFileSync(OUT, JSON.stringify({ ok: false, fatal: String(e), results, timings }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
