#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 App Store blockers — Preview E2E
 * Legal consent, account deletion, RLS tamper, DM stub check
 * Usage: node scripts/e2e-hanakai-v10-appstore-preview.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  assertHanakaiReachable,
  createHanakaiPreviewContext,
} from './lib/vercel-preview-context.mjs';

const HANAKAI_TERMS_VERSION = '2026-07-16';
const HANAKAI_PRIVACY_VERSION = '2026-07-08';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? '').replace(/\/$/, '');
const outDir = path.join(root, 'scripts', 'e2e-screenshots', 'hanakai-v10-appstore');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!baseUrl) {
  console.error('Usage: node scripts/e2e-hanakai-v10-appstore-preview.mjs <previewUrl>');
  process.exit(1);
}
if (!supabaseUrl || !serviceRole || !anonKey) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
const results = [];
let commitId = 'unknown';

function record(id, ok, detail, extra = {}) {
  results.push({ id, ok, detail, ...extra, at: new Date().toISOString() });
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

async function screenshot(page, name) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 60000 }).catch(() => null);
  return !page.url().includes('/login');
}

try {
  commitId = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  // noop
}

const testUsers = {};

async function createLegalTestUser(suffix) {
  const email = `hanakai-e2e-legal-${suffix}@test.hanakai.local`;
  const password = `E2eLegal!${suffix}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { hanakai_password_set: true },
  });
  if (error || !data.user) throw new Error(error?.message ?? 'createUser failed');

  const { data: member, error: memErr } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: data.user.id,
      nickname: '',
      gender: 'other',
      area: '',
      age: 25,
    })
    .select('id')
    .single();
  if (memErr || !member) throw new Error(memErr?.message ?? 'member insert failed');

  return { email, password, authUserId: data.user.id, memberId: member.id };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const { context } = await createHanakaiPreviewContext(browser, baseUrl, env);
  const page = await context.newPage();

  try {
    await assertHanakaiReachable(page, baseUrl);
    record('ENV-01', true, `Preview reachable: ${baseUrl}`, { commitId });
  } catch (e) {
    record('ENV-01', false, String(e.message ?? e));
    throw e;
  }

  // --- Legal consent ---
  const legalUser = await createLegalTestUser(stamp.slice(-8));
  testUsers.legal = legalUser;

  const loggedIn = await login(page, legalUser.email, legalUser.password);
  record('LEGAL-01', loggedIn, loggedIn ? 'Login for legal test user' : 'Login failed');
  if (!loggedIn) throw new Error('Legal test login failed');

  await page.goto(`${baseUrl}/register/profile`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.click('button:has-text("はじめる")').catch(() => null);
  await page.waitForSelector('text=利用規約とプライバシーポリシー', { timeout: 30000 }).catch(() => null);
  const onLegal = (await page.locator('text=利用規約とプライバシーポリシー').count()) > 0;
  record('LEGAL-02', onLegal, onLegal ? 'Legal step visible' : 'Legal step not shown');
  await screenshot(page, 'legal-step');

  const agreeBtn = page.locator('button:has-text("同意して次へ")');
  const btnDisabledWithoutCheck = await agreeBtn.isDisabled();
  record('LEGAL-03', btnDisabledWithoutCheck, btnDisabledWithoutCheck ? 'Submit disabled without consent' : 'Submit enabled without consent — FAIL');

  const termsLink = page.locator('a[href="/terms"]');
  const privacyLink = page.locator('a[href="/privacy"]');
  const [termsHref, privacyHref] = await Promise.all([
    termsLink.getAttribute('href'),
    privacyLink.getAttribute('href'),
  ]);
  record('LEGAL-04', termsHref === '/terms' && privacyHref === '/privacy', `Links: terms=${termsHref} privacy=${privacyHref}`);

  await page.check('input[type="checkbox"]').catch(() => null);
  const boxes = page.locator('input[type="checkbox"]');
  const count = await boxes.count();
  if (count >= 2) {
    await boxes.nth(0).check();
    await boxes.nth(1).check();
  }
  await agreeBtn.click();
  await page.waitForSelector('text=ログイン用パスワード', { timeout: 30000 }).catch(() => null);
  const afterConsent = (await page.locator('text=ログイン用パスワード').count()) > 0;
  record('LEGAL-05', afterConsent, afterConsent ? 'Advanced to password step after consent' : 'Did not advance');

  const { data: memberAfter } = await admin
    .from('hanakai_members')
    .select('terms_agreed_at,privacy_agreed_at,terms_version,privacy_version')
    .eq('id', legalUser.memberId)
    .single();

  const dbOk =
    memberAfter?.terms_agreed_at &&
    memberAfter?.privacy_agreed_at &&
    memberAfter?.terms_version === HANAKAI_TERMS_VERSION &&
    memberAfter?.privacy_version === HANAKAI_PRIVACY_VERSION;
  record('LEGAL-06', Boolean(dbOk), dbOk ? 'DB consent recorded with versions' : JSON.stringify(memberAfter ?? {}));

  // --- RLS / trigger tamper ---
  const { data: signIn } = await admin.auth.signInWithPassword({
    email: legalUser.email,
    password: legalUser.password,
  });
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
  });

  const trustTamper = await userClient
    .from('hanakai_members')
    .update({ identity_verified: true })
    .eq('id', legalUser.memberId);
  record(
    'RLS-01',
    Boolean(trustTamper.error),
    trustTamper.error ? `Trust self-update blocked: ${trustTamper.error.message}` : 'Trust update succeeded — FAIL',
  );

  const nicknameOk = await userClient
    .from('hanakai_members')
    .update({ nickname: 'E2Eニックネーム' })
    .eq('id', legalUser.memberId);
  record('RLS-02', !nicknameOk.error, nicknameOk.error ? `Nickname update failed: ${nicknameOk.error.message}` : 'Nickname update allowed');

  const verified = await createLegalTestUser(`${stamp.slice(-6)}v`);
  const otherTamper = await userClient
    .from('hanakai_members')
    .update({ nickname: 'hack' })
    .eq('id', verified.memberId);
  record(
    'RLS-03',
    Boolean(otherTamper.error) || otherTamper.count === 0,
    otherTamper.error ? `Other member update blocked` : 'Other member update may have succeeded',
  );

  // --- Account deletion ---
  const deleteUser = await createLegalTestUser(`${stamp.slice(-6)}d`);
  testUsers.delete = deleteUser;
  await admin.from('hanakai_members').update({ nickname: '削除テスト', area: '東京', gender: 'female', age_band: '30代' }).eq('id', deleteUser.memberId);

  const delPage = await context.newPage();
  const delLogin = await login(delPage, deleteUser.email, deleteUser.password);
  record('DEL-01', delLogin, delLogin ? 'Delete test user logged in' : 'Delete login failed');

  await delPage.goto(`${baseUrl}/account/delete`, { waitUntil: 'domcontentloaded' });
  await delPage.check('input[type="checkbox"]');
  await delPage.click('button:has-text("アカウントを削除")');
  await delPage.waitForURL((u) => u.pathname === '/' || u.search.includes('account=deleted'), { timeout: 60000 }).catch(() => null);
  await screenshot(delPage, 'account-deleted');

  const relogin = await login(delPage, deleteUser.email, deleteUser.password);
  record('DEL-02', !relogin, relogin ? 'Re-login succeeded — FAIL' : 'Re-login blocked after deletion');

  const { data: authLookup } = await admin.auth.admin.getUserById(deleteUser.authUserId);
  record('DEL-03', !authLookup?.user, authLookup?.user ? 'Auth user still exists — FAIL' : 'Auth user deleted');

  const { data: memberRow } = await admin.from('hanakai_members').select('status,nickname,auth_user_id').eq('id', deleteUser.memberId).maybeSingle();
  record(
    'DEL-04',
    memberRow?.status === 'deleted' && memberRow?.auth_user_id === null,
    `Member row: status=${memberRow?.status} auth_user_id=${memberRow?.auth_user_id ?? 'null'}`,
  );

  // --- DM stub check ---
  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
  const bodyText = await page.locator('body').innerText();
  const hasDmNav = /DM|ダイレクトメッセージ|1:1メッセージ/.test(bodyText);
  record('DM-01', !hasDmNav, hasDmNav ? 'DM navigation visible — review needed' : 'No DM nav on home');

  const report = {
    stamp,
    baseUrl,
    commitId,
    pass: results.every((r) => r.ok),
    passCount: results.filter((r) => r.ok).length,
    failCount: results.filter((r) => !r.ok).length,
    results,
    testUsers: Object.fromEntries(
      Object.entries(testUsers).map(([k, v]) => [k, { email: v.email, memberId: v.memberId }]),
    ),
  };

  const reportPath = path.join(outDir, `${stamp}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(`PASS ${report.passCount} / FAIL ${report.failCount}`);

  await browser.close();
  process.exit(report.pass ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
