#!/usr/bin/env node
/**
 * Visual screenshots for bulk finalize flow on Preview.
 * Usage: node scripts/e2e-host-participant-finalize-screenshots.mjs [previewBaseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'scripts/e2e-screenshots/host-participant-finalize-final');
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
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? '').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || env.VERCEL_AUTOMATION_BYPASS_SECRET;
const adminEmail = env.HANAKAI_E2E_ADMIN_EMAIL;
const adminPassword = env.HANAKAI_E2E_ADMIN_PASSWORD;

const stamp = Date.now();
const password = `E2eShot!${String(stamp).slice(-4)}`;
const tag = `e2e-shot-${stamp}`;

async function login(page, email, passwordValue, nextPath) {
  await page.goto(`${baseUrl}/login?next=${encodeURIComponent(nextPath)}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (!(await page.locator('input[name="email"]').count())) return false;
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(passwordValue);
  await Promise.all([
    page.waitForNavigation({ timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
  await page.waitForTimeout(1500);
  return !page.url().includes('/login');
}

async function adminLogin(page, email, passwordValue) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (!(await page.locator('input[name="email"]').count())) return false;
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(passwordValue);
  await Promise.all([
    page.waitForNavigation({ timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: '管理画面へログイン' }).click(),
  ]);
  await page.waitForTimeout(1500);
  return !page.url().includes('/admin/login');
}

async function waitForHostManageReady(page, eventId) {
  await page.goto(`${baseUrl}/events/manage/${eventId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page
    .getByRole('button', { name: /申請1を参加メンバーに/ })
    .first()
    .waitFor({ state: 'visible', timeout: 45000 })
    .catch(() => null);
  await page.waitForTimeout(800);
}

async function bypass(page) {
  if (bypassSecret && baseUrl.includes('vercel.app')) {
    await page.goto(
      `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`,
      { waitUntil: 'domcontentloaded', timeout: 90000 },
    );
  }
}

if (!baseUrl || !supabaseUrl || !serviceRole) {
  console.error('Missing baseUrl or Supabase credentials');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
const cleanup = { eventId: null, host: null, applicants: [], adminUserId: null };

try {
  const { data: hostUser } = await admin.auth.admin.createUser({
    email: `${tag}-host@test.hanakai.local`,
    password,
    email_confirm: true,
  });
  const { data: hostMember } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: hostUser.user.id,
      nickname: 'Shot主催',
      gender: 'female',
      area: '東京',
      age: 32,
      age_band: '30代',
      avatar_url: 'https://regjgwrugiwbmxcsxuex.supabase.co/storage/v1/object/public/avatars/default.png',
      identity_verified: true,
      document_upload_status: 'approved',
      trust_verification_status: 'verified',
    })
    .select('id')
    .single();
  cleanup.host = { memberId: hostMember.id, authUserId: hostUser.user.id };

  const applicants = [];
  for (let i = 1; i <= 4; i++) {
    const { data: u } = await admin.auth.admin.createUser({
      email: `${tag}-a${i}@test.hanakai.local`,
      password,
      email_confirm: true,
    });
    const { data: m } = await admin
      .from('hanakai_members')
      .insert({
        auth_user_id: u.user.id,
        nickname: `Shot申請${i}`,
        gender: i % 2 ? 'female' : 'male',
        area: '東京',
        age: 28 + i,
        age_band: '20代',
        avatar_url: `https://regjgwrugiwbmxcsxuex.supabase.co/storage/v1/object/public/avatars/default.png`,
        identity_verified: true,
        document_upload_status: 'approved',
        trust_verification_status: 'verified',
      })
      .select('id')
      .single();
    applicants.push({ memberId: m.id, authUserId: u.user.id, nickname: `Shot申請${i}` });
  }
  cleanup.applicants = applicants;

  const startAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data: event } = await admin
    .from('hanakai_events')
    .insert({
      title: `Screenshot E2E ${tag}`,
      category: 'coffee',
      start_at: startAt,
      area: '東京',
      venue: 'Test',
      capacity: 3,
      host_member_id: hostMember.id,
      host_name: 'Shot主催',
      conditions: 'test',
      description: 'screenshot test',
      cover_url: 'https://example.com/cover.jpg',
      status: 'open',
      approval_mode: 'host_approval',
      is_user_created: true,
      fee: 0,
    })
    .select('id')
    .single();
  cleanup.eventId = event.id;

  for (const a of applicants) {
    await admin.from('hanakai_event_applications').insert({
      event_id: event.id,
      member_id: a.memberId,
      status: 'pending',
      reason: `${a.nickname}からの申請`,
    });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await bypass(page);
  const hostLoggedIn = await login(page, `${tag}-host@test.hanakai.local`, password, `/events/manage/${event.id}`);
  if (!hostLoggedIn) throw new Error('host login failed');
  await waitForHostManageReady(page, event.id);
  await page.screenshot({ path: path.join(outDir, '01-host-before-selection.png'), fullPage: true });

  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: new RegExp(`Shot申請${i}を参加メンバーに`) }).click();
  }
  await page.screenshot({ path: path.join(outDir, '02-host-three-selected.png'), fullPage: true });

  await page.getByRole('button', { name: 'このメンバーで開催する' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '03-host-confirm-dialog.png'), fullPage: true });

  await page.getByRole('button', { name: 'このメンバーで決定する' }).click();
  await page.waitForURL(/success=finalized|finalized=1/, { timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04-host-after-finalize.png'), fullPage: true });

  const { data: selectedApp } = await admin
    .from('hanakai_event_applications')
    .select('confirmation_token')
    .eq('event_id', event.id)
    .eq('status', 'awaiting_confirmation')
    .limit(1)
    .maybeSingle();

  if (adminEmail && adminPassword) {
    const adminPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await bypass(adminPage);
    let adminLoggedIn = await login(
      adminPage,
      adminEmail,
      adminPassword,
      `/admin/hanakai/applications?eventId=${event.id}`,
    );
    if (!adminLoggedIn) {
      adminLoggedIn = await adminLogin(adminPage, adminEmail, adminPassword);
    }
    if (adminLoggedIn) {
      await adminPage.goto(`${baseUrl}/admin/hanakai/applications?eventId=${event.id}`, {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
      await adminPage.getByText('参加メンバー選定').waitFor({ state: 'visible', timeout: 45000 }).catch(() => null);
      await adminPage.waitForTimeout(1000);
    }
    await adminPage.screenshot({ path: path.join(outDir, '05-admin-applications.png'), fullPage: true });
    await adminPage.close();
  }

  if (selectedApp?.confirmation_token) {
    const confirmPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await bypass(confirmPage);
    await confirmPage.goto(
      `${baseUrl}/events/participation/confirm?token=${encodeURIComponent(selectedApp.confirmation_token)}`,
      { waitUntil: 'domcontentloaded', timeout: 90000 },
    );
    await confirmPage.waitForTimeout(1500);
    await confirmPage.screenshot({ path: path.join(outDir, '06-participant-confirm.png'), fullPage: true });
    await confirmPage.close();
  }

  const lp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await bypass(lp);
  await lp.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await lp.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await lp.waitForTimeout(1200);
  await lp.screenshot({ path: path.join(outDir, '07-lp-390.png'), fullPage: false });
  await lp.close();

  await page.screenshot({ path: path.join(outDir, '08-host-390-after-finalize.png'), fullPage: true });
  await browser.close();

  console.log(JSON.stringify({ ok: true, outDir, eventId: event.id }, null, 2));
} finally {
  if (cleanup.eventId) {
    await admin.from('hanakai_event_operation_notifications').delete().eq('event_id', cleanup.eventId);
    await admin.from('hanakai_event_applications').delete().eq('event_id', cleanup.eventId);
    await admin.from('hanakai_events').delete().eq('id', cleanup.eventId);
  }
  if (cleanup.host?.authUserId) await admin.auth.admin.deleteUser(cleanup.host.authUserId);
  for (const a of cleanup.applicants) {
    if (a.authUserId) await admin.auth.admin.deleteUser(a.authUserId);
    if (a.memberId) await admin.from('hanakai_members').delete().eq('id', a.memberId);
  }
  if (cleanup.host?.memberId) await admin.from('hanakai_members').delete().eq('id', cleanup.host.memberId);
}
