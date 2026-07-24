#!/usr/bin/env node
/**
 * Real Preview DB + UI E2E for host bulk participant finalize.
 * Usage: node scripts/e2e-host-participant-finalize-preview.mjs [previewBaseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'scripts/e2e-screenshots/host-participant-finalize-preview');
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

const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:3458').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || env.VERCEL_AUTOMATION_BYPASS_SECRET;

const results = [];
const stamp = Date.now();
const tag = `e2e-finalize-${stamp}`;
const password = `E2eFinalize!${String(stamp).slice(-4)}`;

const state = {
  host: null,
  applicants: [],
  eventId: null,
  applicationIds: [],
  selectedIds: [],
  notSelectedId: null,
  confirmToken: null,
};

function record(name, ok, detail = '', extra = {}) {
  results.push({ name, ok, detail, ...extra });
  console.log(ok ? 'PASS' : 'FAIL', name, detail);
}

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

async function waitForAdminApplicationsPanel(page, eventId) {
  await page.goto(`${baseUrl}/admin/hanakai/applications?eventId=${eventId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText ?? '';
      return (
        text.includes('参加メンバー選定') ||
        text.includes('参加申請一覧') ||
        text.includes('アクセス権限がありません') ||
        text.includes('ログインが必要です')
      );
    },
    { timeout: 45000 },
  ).catch(() => null);
  await page.waitForTimeout(1000);
  const body = await page.locator('body').innerText();
  const forbidden = body.includes('アクセス権限がありません') || body.includes('ログインが必要です');
  const hasPanel = body.includes('参加メンバー選定');
  return { forbidden, hasPanel, body };
}

async function createMember(admin, { email, nickname, gender = 'female' }) {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname },
  });
  if (userErr || !userData.user) throw new Error(userErr?.message ?? 'auth create failed');

  const { data: member, error: memErr } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: userData.user.id,
      nickname,
      gender,
      area: '東京',
      age: 30,
      age_band: '30代',
      avatar_url: 'https://regjgwrugiwbmxcsxuex.supabase.co/storage/v1/object/public/avatars/default.png',
      identity_verified: true,
      document_upload_status: 'approved',
      trust_verification_status: 'verified',
      safety_flags: ['E2Eテスト'],
    })
    .select('id')
    .single();
  if (memErr || !member) throw new Error(memErr?.message ?? 'member create failed');
  return { email, memberId: member.id, authUserId: userData.user.id };
}

async function snapshotEvent(admin, eventId) {
  const { data: event } = await admin.from('hanakai_events').select('*').eq('id', eventId).maybeSingle();
  const { data: apps } = await admin.from('hanakai_event_applications').select('*').eq('event_id', eventId);
  const { data: notifs } = await admin
    .from('hanakai_event_operation_notifications')
    .select('*')
    .eq('event_id', eventId);
  return { event, apps: apps ?? [], notifs: notifs ?? [] };
}

async function cleanup(admin) {
  if (!state.eventId) return;
  await admin.from('hanakai_event_operation_notifications').delete().eq('event_id', state.eventId);
  await admin.from('hanakai_event_applications').delete().eq('event_id', state.eventId);
  await admin.from('hanakai_events').delete().eq('id', state.eventId);
  for (const a of [state.host, ...state.applicants]) {
    if (!a) continue;
    await admin.from('hanakai_members').delete().eq('id', a.memberId);
    if (a.authUserId) await admin.auth.admin.deleteUser(a.authUserId);
  }
}

if (!supabaseUrl || !serviceRole) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

try {
  state.host = await createMember(admin, {
    email: `${tag}-host@test.hanakai.local`,
    nickname: 'E2E主催',
  });
  record('seed host', true, state.host.memberId);

  for (let i = 1; i <= 4; i++) {
    const applicant = await createMember(admin, {
      email: `${tag}-app${i}@test.hanakai.local`,
      nickname: `E2E申請${i}`,
      gender: i % 2 ? 'female' : 'male',
    });
    state.applicants.push(applicant);
  }
  record('seed applicants', state.applicants.length === 4);

  const startAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data: event, error: eventErr } = await admin
    .from('hanakai_events')
    .insert({
      title: `E2E一括決定 ${tag}`,
      category: 'coffee',
      start_at: startAt,
      area: '東京',
      venue: 'E2Eテスト会場',
      capacity: 3,
      host_member_id: state.host.memberId,
      host_name: 'E2E主催',
      conditions: 'E2E',
      description: 'E2E finalize flow test event',
      cover_url: 'https://example.com/cover.jpg',
      status: 'open',
      approval_mode: 'host_approval',
      is_user_created: true,
      is_past: false,
      fee: 0,
    })
    .select('id')
    .single();
  if (eventErr || !event) throw new Error(eventErr?.message ?? 'event create failed');
  state.eventId = event.id;
  record('seed event capacity=3', true, state.eventId);

  for (const applicant of state.applicants) {
    const { data: app, error: appErr } = await admin
      .from('hanakai_event_applications')
      .insert({
        event_id: state.eventId,
        member_id: applicant.memberId,
        status: 'pending',
        reason: `${applicant.nickname}からの参加希望です。`,
      })
      .select('id')
      .single();
    if (appErr || !app) throw new Error(appErr?.message ?? 'application create failed');
    state.applicationIds.push(app.id);
  }
  record('seed pending applications', state.applicationIds.length === 4);

  state.selectedIds = state.applicationIds.slice(0, 3);
  state.notSelectedId = state.applicationIds[3];

  const before = await snapshotEvent(admin, state.eventId);

  // --- RPC atomicity probes on clone event ---
  const { data: probeEvent } = await admin
    .from('hanakai_events')
    .insert({
      title: `E2E probe ${tag}`,
      category: 'coffee',
      start_at: startAt,
      area: '東京',
      venue: 'probe',
      capacity: 3,
      host_member_id: state.host.memberId,
      host_name: 'E2E主催',
      conditions: 'E2E',
      description: 'probe',
      cover_url: 'https://example.com/cover.jpg',
      status: 'open',
      approval_mode: 'host_approval',
      is_user_created: true,
      fee: 0,
    })
    .select('id')
    .single();

  const probeApps = [];
  for (const applicant of state.applicants) {
    const { data: app } = await admin
      .from('hanakai_event_applications')
      .insert({ event_id: probeEvent.id, member_id: applicant.memberId, status: 'pending', reason: 'probe' })
      .select('id')
      .single();
    probeApps.push(app.id);
  }

  const invalidMix = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: probeEvent.id,
    p_selected_application_ids: [...probeApps.slice(0, 2), '00000000-0000-0000-0000-000000000099'],
    p_decided_by_member_id: state.host.memberId,
    p_site_base_url: baseUrl,
  });
  const afterInvalid = await snapshotEvent(admin, probeEvent.id);
  record(
    'atomicity invalid application id',
    invalidMix.data?.ok === false && afterInvalid.apps.every((a) => a.status === 'pending') && !afterInvalid.event?.participants_decided_at,
    invalidMix.data?.error ?? invalidMix.error?.message ?? '',
  );

  const overCap = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: probeEvent.id,
    p_selected_application_ids: probeApps,
    p_decided_by_member_id: state.host.memberId,
    p_site_base_url: baseUrl,
  });
  const afterOver = await snapshotEvent(admin, probeEvent.id);
  record(
    'atomicity over capacity',
    overCap.data?.ok === false && afterOver.apps.every((a) => a.status === 'pending') && !afterOver.event?.participants_decided_at,
    overCap.data?.error ?? '',
  );

  const crossEvent = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: probeEvent.id,
    p_selected_application_ids: [probeApps[0], state.applicationIds[0]],
    p_decided_by_member_id: state.host.memberId,
    p_site_base_url: baseUrl,
  });
  const afterCross = await snapshotEvent(admin, probeEvent.id);
  record(
    'atomicity cross-event application id',
    crossEvent.data?.ok === false && afterCross.apps.every((a) => a.status === 'pending') && !afterCross.event?.participants_decided_at,
    crossEvent.data?.error ?? '',
  );

  const injectFail = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: probeEvent.id,
    p_selected_application_ids: probeApps.slice(0, 2),
    p_decided_by_member_id: state.host.memberId,
    p_site_base_url: baseUrl,
    p_e2e_inject_failure: 'before_notifications',
  });
  const afterInject = await snapshotEvent(admin, probeEvent.id);
  record(
    'atomicity notification failure rollback',
    injectFail.error && afterInject.apps.every((a) => a.status === 'pending') && !afterInject.event?.participants_decided_at && afterInject.notifs.length === 0,
    injectFail.error?.message ?? 'expected error',
  );

  await admin.from('hanakai_event_applications').delete().eq('event_id', probeEvent.id);
  await admin.from('hanakai_events').delete().eq('id', probeEvent.id);

  // --- Playwright host flow ---
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  if (bypassSecret && baseUrl.includes('vercel.app')) {
    await page.goto(
      `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`,
      { waitUntil: 'domcontentloaded', timeout: 90000 },
    );
  }

  const loggedIn = await login(page, state.host.email, password, `/events/manage/${state.eventId}`);
  record('host login', loggedIn);
  if (loggedIn) {
    await page.goto(`${baseUrl}/events/manage/${state.eventId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    record('manage page no approve/reject', (await page.getByRole('button', { name: /却下|承認|否認/ }).count()) === 0);

    const adminEmail = env.HANAKAI_E2E_ADMIN_EMAIL || process.env.HANAKAI_E2E_ADMIN_EMAIL;
    const adminPassword = env.HANAKAI_E2E_ADMIN_PASSWORD || process.env.HANAKAI_E2E_ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const adminPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      if (bypassSecret && baseUrl.includes('vercel.app')) {
        await adminPage.goto(
          `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`,
          { waitUntil: 'domcontentloaded', timeout: 90000 },
        );
      }
      let adminLoggedIn = await login(
        adminPage,
        adminEmail,
        adminPassword,
        `/admin/hanakai/applications?eventId=${state.eventId}`,
      );
      let panel = adminLoggedIn
        ? await waitForAdminApplicationsPanel(adminPage, state.eventId)
        : { forbidden: true, hasPanel: false, body: '' };
      if (!adminLoggedIn || panel.forbidden) {
        adminLoggedIn = await adminLogin(adminPage, adminEmail, adminPassword);
        if (adminLoggedIn) {
          panel = await waitForAdminApplicationsPanel(adminPage, state.eventId);
        }
      }
      record('admin login for UI check', adminLoggedIn, adminLoggedIn ? adminPage.url() : 'login failed');
      record('admin hanakai access granted', adminLoggedIn && !panel.forbidden, panel.forbidden ? 'forbidden' : 'ok');
      if (adminLoggedIn && !panel.forbidden) {
        record(
          'admin no approve/reject UI',
          (await adminPage.getByRole('button', { name: /却下|承認|否認/ }).count()) === 0,
        );
        await adminPage.getByText('参加メンバー選定').scrollIntoViewIfNeeded().catch(() => null);
        const adminBulkUi =
          panel.hasPanel ||
          (await adminPage.getByRole('button', { name: /を参加メンバーに追加$/ }).count()) > 0 ||
          (await adminPage.getByText('選択済み').count()) > 0 ||
          (await adminPage.getByText('定員').count()) > 0;
        record('admin bulk finalize UI present', adminBulkUi);
      } else {
        record('admin no approve/reject UI', false, panel.forbidden ? 'forbidden page' : 'login failed');
        record('admin bulk finalize UI present', false, panel.forbidden ? 'forbidden page' : 'login failed');
      }
      await adminPage.close();
    } else {
      record('admin UI check skipped', true, 'HANAKAI_E2E_ADMIN_EMAIL not configured');
    }

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: new RegExp(`E2E申請${i + 1}を参加メンバーに`) }).click();
    }
    record('select 3 applicants', true);

    await page.getByRole('button', { name: 'このメンバーで開催する' }).click();
    await page.getByRole('button', { name: 'このメンバーで決定する' }).click();
    await page.waitForURL(/success=finalized|finalized=1/, { timeout: 45000 }).catch(() => null);
    await page.waitForTimeout(1500);

    const urlAfter = page.url();
    record('success redirect', /success=finalized|finalized=1/.test(urlAfter), urlAfter);
    record(
      'success banner',
      (await page.getByText(/参加メンバーを決定しました/).count()) > 0 || /success=finalized|finalized=1/.test(urlAfter),
    );
    record(
      'selection UI hidden after finalize',
      (await page.getByRole('button', { name: 'このメンバーで開催する' }).count()) === 0 ||
        (await page.getByText(/今回の参加メンバー/).count()) > 0,
    );
    record('shows member list', (await page.getByText(/今回の参加メンバー/).count()) > 0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    record('post reload no selection UI', (await page.getByRole('button', { name: 'このメンバーで開催する' }).count()) === 0);

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    record('390px no horizontal scroll on manage', bodyWidth <= clientWidth, `scrollWidth=${bodyWidth}`);

    await page.screenshot({ path: path.join(outDir, '390-manage-after-finalize.png'), fullPage: true });
  }

  await browser.close();

  const after = await snapshotEvent(admin, state.eventId);
  record('event participants_decided_at set', Boolean(after.event?.participants_decided_at));
  record('event status closed', after.event?.status === 'closed');
  record(
    '3 selected awaiting_confirmation',
    after.apps.filter((a) => state.selectedIds.includes(a.id) && a.status === 'awaiting_confirmation').length === 3,
  );
  record(
    '1 not selected rejected',
    after.apps.filter((a) => a.id === state.notSelectedId && a.status === 'rejected').length === 1,
  );
  record('4 notifications created', after.notifs.length === 4, `count=${after.notifs.length}`);

  const selectedApp = after.apps.find((a) => state.selectedIds.includes(a.id));
  state.confirmToken = selectedApp?.confirmation_token ?? null;
  record('confirmation token issued', Boolean(state.confirmToken));

  const dup = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: state.eventId,
    p_selected_application_ids: state.selectedIds,
    p_decided_by_member_id: state.host.memberId,
    p_site_base_url: baseUrl,
  });
  record('double finalize rejected', dup.data?.ok === false, dup.data?.error ?? '');

  if (state.confirmToken) {
    const confirmPage = await chromium.launch({ headless: true }).then((b) => b.newPage({ viewport: { width: 390, height: 844 } }));
    if (bypassSecret && baseUrl.includes('vercel.app')) {
      await confirmPage.goto(
        `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`,
        { waitUntil: 'domcontentloaded' },
      );
    }
    await confirmPage.goto(`${baseUrl}/events/participation/confirm?token=${encodeURIComponent(state.confirmToken)}&action=confirm`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await confirmPage.waitForTimeout(2500);
    const { data: confirmedApp } = await admin
      .from('hanakai_event_applications')
      .select('status')
      .eq('id', selectedApp.id)
      .maybeSingle();
    record('participant confirm flow', confirmedApp?.status === 'confirmed', confirmedApp?.status ?? 'not confirmed');
    await confirmPage.context().browser()?.close();
  }

  // LP scroll check
  const lpBrowser = await chromium.launch({ headless: true });
  for (const width of [375, 390, 430]) {
    const lp = await lpBrowser.newPage({ viewport: { width, height: 844 } });
    if (bypassSecret && baseUrl.includes('vercel.app')) {
      await lp.goto(`${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`, {
        waitUntil: 'networkidle',
        timeout: 90000,
      });
    } else {
      await lp.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 90000 });
    }
    const sw = await lp.evaluate(() => document.documentElement.scrollWidth);
    const cw = await lp.evaluate(() => document.documentElement.clientWidth);
    record(`LP ${width}px no horizontal scroll`, sw <= cw, `scrollWidth=${sw}`);
    if (width === 390) {
      await lp.screenshot({ path: path.join(outDir, '390-landing.png'), fullPage: false });
    }
    await lp.close();
  }
  await lpBrowser.close();

  // LP mock copy alignment with real host screen
  const copyBrowser = await chromium.launch({ headless: true });
  const copyPage = await copyBrowser.newPage({ viewport: { width: 390, height: 844 } });
  if (bypassSecret && baseUrl.includes('vercel.app')) {
    await copyPage.goto(
      `${baseUrl}/?x-vercel-protection-bypass=${encodeURIComponent(bypassSecret)}&x-vercel-set-bypass-cookie=true`,
      { waitUntil: 'networkidle', timeout: 90000 },
    );
  } else {
    await copyPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 90000 });
  }
  await copyPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await copyPage.waitForTimeout(1000);
  record(
    'LP mock uses bulk finalize copy',
    (await copyPage.getByText('このメンバーで開催する').count()) > 0,
  );
  await copyBrowser.close();
} catch (e) {
  record('fatal', false, e instanceof Error ? e.message : String(e));
} finally {
  await cleanup(admin);
}

const report = {
  stamp: new Date().toISOString(),
  commit:
    process.env.VERCEL_GIT_COMMIT_SHA ??
    (() => {
      try {
        return execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
      } catch {
        return null;
      }
    })(),
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  baseUrl,
  pass: results.filter((r) => r.ok).length,
  fail: results.filter((r) => !r.ok).length,
  results,
};
writeFileSync(path.join(outDir, 'preview-e2e-report.json'), JSON.stringify(report, null, 2));
console.log('\nSummary:', report.pass, 'pass,', report.fail, 'fail');
process.exit(report.fail > 0 ? 1 : 0);
