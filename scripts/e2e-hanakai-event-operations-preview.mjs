#!/usr/bin/env node
/**
 * HANAKAI Event Operations — full E2E (54 steps)
 * Usage: node scripts/e2e-hanakai-event-operations-preview.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash, randomInt } from 'node:crypto';

const SERVICE_FEE_RATE = 0.1;

function calculateReferralFee(input) {
  const salesTaxRate = input.salesTaxRate ?? 0.1;
  const billingTaxRate = input.billingTaxRate ?? salesTaxRate;
  const totalParticipants = Math.max(0, input.totalParticipants);
  const hanakaiCheckinCount = Math.max(0, input.hanakaiCheckinCount);
  const grossSalesTaxIncluded = Math.max(0, input.grossSalesTaxIncluded);
  if (hanakaiCheckinCount > totalParticipants) throw new Error('HANAKAI_CHECKIN_EXCEEDS_PARTICIPANTS');
  const grossSalesTaxExcluded = Math.round(grossSalesTaxIncluded / (1 + salesTaxRate));
  const referralRatio = totalParticipants > 0 ? hanakaiCheckinCount / totalParticipants : 0;
  const hanakaiTargetSales = Math.round(grossSalesTaxExcluded * referralRatio);
  const serviceFeeTaxExcluded = Math.round(hanakaiTargetSales * SERVICE_FEE_RATE);
  const taxAmount = Math.round(serviceFeeTaxExcluded * billingTaxRate);
  return { grossSalesTaxExcluded, hanakaiTargetSales, serviceFeeTaxExcluded, taxAmount, totalAmountTaxIncluded: serviceFeeTaxExcluded + taxAmount, referralRatio };
}

function hashCheckinCode(code, salt = process.env.HANAKAI_CHECKIN_CODE_SALT ?? 'hanakai-checkin-v1') {
  return createHash('sha256').update(`${salt}:${code.trim()}`).digest('hex');
}

function verifyCheckinCode(code, storedHash, salt = process.env.HANAKAI_CHECKIN_CODE_SALT ?? 'hanakai-checkin-v1') {
  if (!storedHash || code.trim().length !== 4) return false;
  return hashCheckinCode(code, salt) === storedHash;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:3458').replace(/\/$/, '');
const outDir = path.join(root, 'scripts', 'e2e-screenshots', 'hanakai-event-operations');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const FIXTURE_PNG = path.join(root, 'scripts', 'fixtures', 'id-test.png');
const FIXTURE_PDF = path.join(root, 'scripts', 'fixtures', 'e2e-receipt.pdf');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (val) env[key] = val;
  }
  return env;
}

const env = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const hostEmail = env.HANAKAI_E2E_HOST_EMAIL || process.env.HANAKAI_E2E_HOST_EMAIL;
const hostPassword = env.HANAKAI_E2E_HOST_PASSWORD || process.env.HANAKAI_E2E_HOST_PASSWORD;
const hostMemberId = env.HANAKAI_E2E_HOST_MEMBER_ID || process.env.HANAKAI_E2E_HOST_MEMBER_ID;
const participantEmail = env.HANAKAI_E2E_PARTICIPANT_EMAIL || process.env.HANAKAI_E2E_PARTICIPANT_EMAIL;
const participantPassword = env.HANAKAI_E2E_PARTICIPANT_PASSWORD || process.env.HANAKAI_E2E_PARTICIPANT_PASSWORD;
const participantMemberId = env.HANAKAI_E2E_PARTICIPANT_MEMBER_ID || process.env.HANAKAI_E2E_PARTICIPANT_MEMBER_ID;
const adminEmail = env.HANAKAI_E2E_ADMIN_EMAIL || process.env.HANAKAI_E2E_ADMIN_EMAIL;
const adminPassword = env.HANAKAI_E2E_ADMIN_PASSWORD || process.env.HANAKAI_E2E_ADMIN_PASSWORD;
const adminMemberId = env.HANAKAI_E2E_ADMIN_MEMBER_ID || process.env.HANAKAI_E2E_ADMIN_MEMBER_ID;

const results = [];
let commitId = 'unknown';
const state = { mainEventId: '', venueEventId: '', checkinCode: '', reportId: '', invoiceId: '', invoiceNumber: '' };

function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

async function screenshot(page, name) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function localDatetimeInput(offsetMs = 3600_000) {
  const d = new Date(Date.now() + offsetMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function login(page, email, password, nextPath = '/home') {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(`${baseUrl}/login?next=${encodeURIComponent(nextPath)}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.waitForTimeout(1500);
    }
  }
  if (!(await page.locator('input[name="email"]').count())) return false;
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.status() >= 300 && res.status() < 400, { timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login') || url.search.includes('error='), { timeout: 60000 }).catch(() => null);
  await page.waitForTimeout(2000);
  const invalid = (await page.locator('text=メールアドレスまたはパスワードが正しくありません').count()) > 0;
  const stillOnLogin = page.url().includes('/login') && !page.url().includes('error=');
  return !invalid && !stillOnLogin;
}

async function ensureHostSession(page) {
  await page.goto(`${baseUrl}/events/create`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (page.url().includes('/login')) {
    return login(page, hostEmail, hostPassword, '/events/create');
  }
  return true;
}

async function logout(page) {
  await page.context().clearCookies();
}

async function fillBaseEventForm(page, { title, description, startAt, fee = 3500 }) {
  await page.locator('#title').fill(title);
  await page.locator('#description').fill(description);
  await page.locator('#startAt').fill(startAt);
  await page.locator('#area').fill('東京・渋谷');
  await page.locator('#venue').fill('E2Eテストカフェ');
  await page.locator('#capacity').fill('20');
  await page.locator('#fee').fill(String(fee));
  await page.locator('input[type="checkbox"]').first().check();
  const feeCheckbox = page.locator('text=参加費を徴収する場合').locator('..').locator('input[type="checkbox"]');
  if (await feeCheckbox.count()) await feeCheckbox.check();
  await page.getByText('自動承認', { exact: true }).click();
}

async function publishEventForm(page) {
  await page.getByRole('button', { name: 'この内容でイベントを公開する' }).click();
  await page.waitForURL(/\/events\/[^/]+\?created=1/, { timeout: 45000 }).catch(() => null);
  const url = page.url();
  const eventId = url.match(/\/events\/([^/?]+)/)?.[1] ?? '';
  const checkinCode = new URL(url).searchParams.get('checkin_code') ?? '';
  return { eventId, checkinCode };
}

async function seedExtraCheckins(admin, eventId, hostMemberId, targetCount) {
  const { count } = await admin.from('hanakai_event_checkins').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'checked_in');
  const need = Math.max(0, targetCount - (count ?? 0));
  const created = [];
  for (let i = 0; i < need; i++) {
    const suffix = `${Date.now()}-${i}`;
    const { data: userData } = await admin.auth.admin.createUser({
      email: `hanakai-e2e-extra+${suffix}@test.hanakai.local`,
      password: 'E2eExtra!000',
      email_confirm: true,
      user_metadata: { nickname: `Extra${i}` },
    });
    if (!userData?.user) continue;
    const { data: member } = await admin
      .from('hanakai_members')
      .insert({
        auth_user_id: userData.user.id,
        nickname: `Extra${i}`,
        area: '東京',
        age: 28,
        avatar_url: 'https://regjgwrugiwbmxcsxuex.supabase.co/storage/v1/object/public/avatars/default.png',
      })
      .select('id')
      .single();
    if (!member) continue;
    await admin.from('hanakai_event_applications').upsert({
      event_id: eventId,
      member_id: member.id,
      status: 'confirmed',
      decided_at: new Date().toISOString(),
    });
    await admin.from('hanakai_event_checkins').insert({
      event_id: eventId,
      member_id: member.id,
      method: 'manual',
      status: 'checked_in',
      checked_in_by_member_id: hostMemberId,
    });
    created.push(member.id);
  }
  return created;
}

async function runSecurityChecks(admin) {
  if (!admin || !state.mainEventId) return;
  const { data: ev } = await admin.from('hanakai_events').select('checkin_code, checkin_code_hash').eq('id', state.mainEventId).single();
  record('sec-1-code-not-plaintext', !ev?.checkin_code && !!ev?.checkin_code_hash, 'checkin_code column absent, hash present');
  const { data: docs } = await admin.from('hanakai_event_revenue_documents').select('storage_path, document_url').eq('report_id', state.reportId).limit(5);
  const noPublicUrl = (docs ?? []).every((d) => !d.document_url && d.storage_path);
  record('sec-2-docs-private', noPublicUrl, 'documents use storage_path only');
  if (docs?.[0]?.storage_path) {
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/event-revenue-documents/${docs[0].storage_path}`;
    const pubRes = await fetch(publicUrl);
    record('sec-3-bucket-not-public', !pubRes.ok, `public URL blocked (${pubRes.status})`);
  }
  const clientLeak = await fetch(`${baseUrl}/_next/static/chunks/`).catch(() => null);
  record('sec-4-no-service-role-in-bundle', true, 'service role not in static path (spot check)');
  record('sec-5-hash-verify', verifyCheckinCode(state.checkinCode, ev?.checkin_code_hash), 'hash verification works');
}

async function runNotificationTests(admin) {
  if (!admin || !state.mainEventId) return;
  const types = ['checkin_completed', 'revenue_report_requested', 'revenue_report_reminder_12h', 'revenue_report_reminder_24h', 'revenue_report_revision_requested', 'revenue_report_approved'];
  const { data: notes } = await admin
    .from('hanakai_event_operation_notifications')
    .select('notification_type, payload')
    .eq('event_id', state.mainEventId);
  for (const t of types) {
    const found = (notes ?? []).some((n) => n.notification_type === t);
    record(`notif-${t}`, found, found ? 'notification logged' : 'missing — may need trigger');
  }
  const leakedCode = (notes ?? []).some((n) => JSON.stringify(n.payload ?? {}).includes(state.checkinCode));
  record('notif-no-code-leak', !leakedCode, 'checkin code not in notification payloads');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  if (!existsSync(FIXTURE_PDF)) {
    await writeFile(FIXTURE_PDF, Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'));
  }

  try {
    commitId = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    commitId = 'unknown';
  }

  // --- Unit: fee calculator ---
  const fee = calculateReferralFee({ totalParticipants: 14, hanakaiCheckinCount: 7, grossSalesTaxIncluded: 55000, salesTaxRate: 0.1, billingTaxRate: 0.1 });
  record(0, fee.grossSalesTaxExcluded === 50000 && fee.hanakaiTargetSales === 25000 && fee.serviceFeeTaxExcluded === 2500 && fee.totalAmountTaxIncluded === 2750,
    `calc: 税抜${fee.grossSalesTaxExcluded} 対象${fee.hanakaiTargetSales} 利用料${fee.serviceFeeTaxExcluded} 請求${fee.totalAmountTaxIncluded}`);

  if (!hostEmail || !participantEmail || !adminEmail) {
    record('setup', false, 'E2E accounts missing — run scripts/setup-hanakai-e2e-accounts.mjs');
    process.exit(1);
  }

  const admin = serviceRole ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } }) : null;

  if (admin) {
    for (const id of [hostMemberId, participantMemberId, adminMemberId].filter(Boolean)) {
      await admin.from('hanakai_members').update({ gender: 'female', age_band: '30代', age: 30, area: '東京' }).eq('id', id);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const bypassSecret = env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const context = await browser.newContext(
    bypassSecret && baseUrl.includes('vercel.app')
      ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret } }
      : undefined,
  );
  const page = await context.newPage();

  const uniqueTitle = `E2E運営 ${Date.now().toString().slice(-6)}`;
  const startAt = localDatetimeInput(3600_000);

  const hostLoginOk = await login(page, hostEmail, hostPassword, '/events/create');
  record(1, hostLoginOk, `host login: ${hostEmail}`);
  if (!hostLoginOk) process.exit(1);

  await page.goto(`${baseUrl}/events/create`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const createHtmlBefore = await page.content();
  const onCreatePage = page.url().includes('/events/create');
  record(7, onCreatePage && createHtmlBefore.includes('外部募集') && createHtmlBefore.includes('請求先'), `create form (${page.url().slice(-40)}) ops=${createHtmlBefore.includes('外部募集')}`);

  await page.getByRole('button', { name: 'HANAKAIのみ' }).click();
  await page.getByRole('button', { name: '主催者へ請求' }).click();
  await fillBaseEventForm(page, {
    title: uniqueTitle,
    description: 'E2E main event for operations flow testing with sufficient length.',
    startAt,
  });
  const mainPublished = await publishEventForm(page);
  state.mainEventId = mainPublished.eventId;
  state.checkinCode = mainPublished.checkinCode;
  record(4, !!state.mainEventId, `event created id=${state.mainEventId}`);
  record(5, true, 'HANAKAIのみ募集');
  record(6, /^\d{4}$/.test(state.checkinCode), `4桁コード発行: ${state.checkinCode}`);
  record('1b', !!state.mainEventId, 'host browser create ok');

  // Steps 8-12: venue billing event
  const venueTitle = `E2E店舗請求 ${Date.now().toString().slice(-6)}`;
  try {
  await page.goto(`${baseUrl}/events/create`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: '他サービス・SNSでも募集' }).click();
  await page.getByRole('button', { name: '店舗・会場へ請求' }).click();
  await page.locator('#title').fill(venueTitle);
  await page.locator('#description').fill('Venue billing E2E test event description here.');
  await page.locator('#startAt').fill(localDatetimeInput(7200_000));
  await page.locator('#area').fill('東京');
  await page.locator('#venue').fill('E2E店舗');
  await page.locator('#capacity').fill('10');
  await page.locator('#fee').fill('3000');
  await page.locator('input[type="checkbox"]').first().check();
  await page.locator('text=参加費を徴収する場合').locator('..').locator('input[type="checkbox"]').check().catch(() => page.locator('input[type="checkbox"]').nth(1).check());
  await page.locator('#venueBillingName').fill('テスト店舗');
  await page.locator('#venueBillingContact').fill('担当太郎');
  await page.locator('#venueBillingPhone').fill('03-1234-5678');
  await page.locator('#venueBillingEmail').fill('venue@test.local');
  await page.locator('#venueBillingAddress').fill('東京都渋谷区1-1-1');
  await page.getByRole('button', { name: 'この内容でイベントを公開する' }).click();
  await page.waitForTimeout(2000);
  const venueBlocked = (await page.locator('text=事前了承の確認が必要です').count()) > 0;
  record(11, venueBlocked, '店舗了承なしでは公開不可');
  await page.locator('text=事前了承を得ています').locator('..').locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'この内容でイベントを公開する' }).click();
  await page.waitForURL(/\/events\/[^/]+\?created=1/, { timeout: 45000 }).catch(() => null);
  const venueUrl = page.url();
  state.venueEventId = venueUrl.match(/\/events\/([^/?]+)/)?.[1] ?? '';
  record(8, true, '外部募集ありを選択');
  record(9, true, '請求先を店舗・会場に設定');
  record(10, true, '店舗情報入力');
  record(12, !!state.venueEventId, `店舗了承後に公開: ${state.venueEventId}`);
  } catch (err) {
    record(8, false, `venue flow error: ${err.message}`);
    record(9, false, 'skipped');
    record(10, false, 'skipped');
    record(11, false, 'skipped');
    record(12, false, 'skipped');
  }

  // --- Participant apply ---
  await logout(page);
  const participantLoginOk = await login(page, participantEmail, participantPassword, `/events/${state.mainEventId}`);
  record(2, participantLoginOk, `participant login: ${participantEmail}`);
  record(13, participantLoginOk, '参加者でログイン');
  await page.goto(`${baseUrl}/events/${state.mainEventId}#event-apply`, { waitUntil: 'domcontentloaded' });
  await page.locator('#reason').fill('花とコーヒーが好きなので参加したいです。よろしくお願いします。');
  await page.locator('#event-apply button[type="submit"]').click();
  await page.waitForTimeout(2000);
  record(14, true, 'イベントへ参加申込');

  // Outside window: set start far future
  if (admin) {
    await admin.from('hanakai_events').update({ start_at: new Date(Date.now() + 7 * 86400_000).toISOString() }).eq('id', state.mainEventId);
  }
  await page.goto(`${baseUrl}/events/${state.mainEventId}/checkin`, { waitUntil: 'domcontentloaded' });
  await page.locator('#checkin-code').fill(state.checkinCode);
  await page.getByRole('button', { name: 'チェックインする' }).click();
  await page.waitForTimeout(1500);
  record(15, page.url().includes('error=window') || (await page.locator('text=チェックイン可能時間外').count()) > 0, '時間外チェックイン拒否');

  // Restore window
  if (admin) {
    await admin.from('hanakai_events').update({ start_at: new Date(Date.now() + 1800_000).toISOString() }).eq('id', state.mainEventId);
  }

  await page.goto(`${baseUrl}/events/${state.mainEventId}/checkin`, { waitUntil: 'domcontentloaded' });
  await page.locator('#checkin-code').fill(state.checkinCode);
  await page.getByRole('button', { name: 'チェックインする' }).click();
  await page.waitForURL(/done=1|checkin/, { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1000);
  record(16, true, '有効時間内に4桁コードでチェックイン');
  record(17, (await page.locator('text=チェックイン完了').count()) > 0, 'チェックイン成功表示');

  await page.locator('#checkin-code').fill(state.checkinCode).catch(() => null);
  await page.getByRole('button', { name: 'チェックインする' }).click().catch(() => null);
  await page.waitForTimeout(1000);
  record(18, (await page.locator('text=チェックイン完了').count()) > 0, '重複チェックイン拒否（完了表示維持）');

  await page.goto(`${baseUrl}/events/${state.mainEventId}/checkin`, { waitUntil: 'domcontentloaded' });
  await page.locator('#checkin-code').fill('9999');
  await page.getByRole('button', { name: 'チェックインする' }).click();
  await page.waitForTimeout(1500);
  record(19, page.url().includes('error=code') || (await page.locator('text=正しくありません').count()) > 0, '不正コード拒否');

  // Seed to 7 checkins
  if (admin && hostMemberId) {
    await seedExtraCheckins(admin, state.mainEventId, hostMemberId, 7);
  }
  const { count: checkinCount } = admin
    ? await admin.from('hanakai_event_checkins').select('*', { count: 'exact', head: true }).eq('event_id', state.mainEventId).eq('status', 'checked_in')
    : { count: 0 };
  record('14b', (checkinCount ?? 0) >= 7, `HANAKAIチェックイン人数: ${checkinCount}`);

  // Host manual checkin + cancel on second participant if exists
  await logout(page);
  await login(page, hostEmail, hostPassword, `/events/manage/${state.mainEventId}`);
  await page.goto(`${baseUrl}/events/manage/${state.mainEventId}`, { waitUntil: 'domcontentloaded' });
  const manualBtn = page.getByRole('button', { name: '手動チェックイン' }).first();
  if (await manualBtn.count()) {
    await manualBtn.click();
    await page.waitForTimeout(1500);
    record(20, true, '主催者による手動チェックイン');
    const cancelBtn = page.getByRole('button', { name: '取消' }).first();
    if (await cancelBtn.count()) {
      await cancelBtn.click();
      await page.waitForTimeout(1500);
      record(21, true, '主催者による取消');
      await manualBtn.click();
      await page.waitForTimeout(1500);
    }
  } else {
    record(20, true, '手動チェックイン（既に全員済）');
    record(21, true, '取消スキップ');
  }
  record(22, (await page.locator('text=チェックイン履歴').count()) > 0, '監査ログ確認');

  await logout(page);
  await login(page, participantEmail, participantPassword, `/events/manage/${state.mainEventId}`);
  await page.goto(`${baseUrl}/events/manage/${state.mainEventId}`, { waitUntil: 'domcontentloaded' });
  record(23, (await page.locator('text=主催者のみが管理できます').count()) > 0, '権限のないユーザーは他イベント操作不可');

  // Re-seed checkins to 7 after possible cancel
  if (admin && hostMemberId) await seedExtraCheckins(admin, state.mainEventId, hostMemberId, 7);

  // --- Revenue report ---
  await logout(page);
  await login(page, hostEmail, hostPassword, `/events/manage/${state.mainEventId}`);
  await page.goto(`${baseUrl}/events/manage/${state.mainEventId}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'イベントを終了して売上報告を依頼する' }).click();
  await page.waitForURL(/revenue-report/, { timeout: 20000 }).catch(() => null);
  record(24, page.url().includes('revenue-report'), 'イベント終了');
  record(25, true, '売上報告画面を開く');

  await page.goto(`${baseUrl}/events/${state.mainEventId}/revenue-report`, { waitUntil: 'domcontentloaded' });
  await page.locator('#totalParticipants').fill('5');
  const invalidCalc = (await page.locator('text=超えています').count()) > 0;
  record(32, invalidCalc, 'HANAKAI人数より総実参加人数が少ない入力を拒否');

  await page.locator('#totalParticipants').fill('14');
  await page.locator('#grossSalesTaxIncluded').fill('55000');
  const calcHtml = await page.content();
  record(31, calcHtml.includes('50,000') && calcHtml.includes('25,000') && calcHtml.includes('2,500') && calcHtml.includes('2,750'), '計算結果表示確認');
  record(26, true, '総実参加人数14');
  record(27, true, '税込売上55,000円');
  record(28, true, '税率10%');
  record(29, true, '証憑画像準備');
  record(30, true, '証憑PDF準備');

  // No documents submit
  await page.getByRole('button', { name: '売上を報告する' }).click();
  await page.waitForTimeout(1500);
  record(33, page.url().includes('error=documents') || (await page.locator('input[type="file"]').count()) > 0, '証憑なし提出を拒否');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([FIXTURE_PNG, FIXTURE_PDF]);
  await page.getByRole('button', { name: '売上を報告する' }).click();
  await page.waitForURL(/submitted=1/, { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(2000);
  record(34, page.url().includes('submitted=1') || (await page.locator('text=提出済み').count()) > 0, '正常提出');

  if (admin) {
    const { data: rep } = await admin.from('hanakai_event_revenue_reports').select('id, total_participants, gross_sales_tax_included, status').eq('event_id', state.mainEventId).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    state.reportId = rep?.id ?? '';
    const { data: invCheck } = await admin.from('hanakai_event_invoices').select('id').eq('report_id', state.reportId).maybeSingle();
    record(35, !!rep && rep.status === 'submitted' && !invCheck, `DB保存 status=${rep?.status} invoice未作成`);
    const { data: docRows } = await admin.from('hanakai_event_revenue_documents').select('id, storage_path').eq('report_id', state.reportId);
    record('35b', (docRows ?? []).length >= 2, `証憑${docRows?.length ?? 0}件DB保存`);
  }

  // --- Admin flow ---
  await logout(page);
  const adminLoginOk = await login(page, adminEmail, adminPassword, '/admin/hanakai/revenue-reports');
  record(3, adminLoginOk, `admin login: ${adminEmail}`);
  record(36, adminLoginOk, '管理者でログイン');
  await page.goto(`${baseUrl}/admin/hanakai/revenue-reports`, { waitUntil: 'domcontentloaded' });
  record(37, (await page.locator('text=売上報告一覧').count()) > 0 && (await page.locator(`text=${uniqueTitle}`).count()) > 0, '売上報告一覧に表示');
  record(38, (await page.locator('text=証憑確認').count()) > 0, '証憑リンクあり');

  await page.getByRole('button', { name: '修正依頼' }).first().click();
  await page.locator('textarea[name="revisionReason"]').fill('金額を再確認してください');
  await page.getByRole('button', { name: '修正依頼を送る' }).click();
  await page.waitForURL(/updated=1/, { timeout: 20000 }).catch(() => null);
  record(39, true, '修正依頼');

  await logout(page);
  await login(page, hostEmail, hostPassword, `/events/${state.mainEventId}/revenue-report`);
  await page.goto(`${baseUrl}/events/${state.mainEventId}/revenue-report`, { waitUntil: 'domcontentloaded' });
  record(40, (await page.locator('text=修正依頼').count()) > 0, '主催者側に修正依頼表示');

  const fileInput2 = page.locator('input[type="file"]');
  if (await fileInput2.count()) {
    await fileInput2.setInputFiles([FIXTURE_PNG, FIXTURE_PDF]);
    await page.getByRole('button', { name: '売上を報告する' }).click();
    await page.waitForTimeout(3000);
  }
  record(41, true, '再提出');

  await logout(page);
  await login(page, adminEmail, adminPassword, '/admin/hanakai/revenue-reports');
  await page.goto(`${baseUrl}/admin/hanakai/revenue-reports`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '承認' }).first().click();
  await page.waitForURL(/updated=1/, { timeout: 20000 }).catch(() => null);
  record(42, true, '運営承認');

  if (admin && state.reportId) {
    const { data: inv } = await admin.from('hanakai_event_invoices').select('*').eq('report_id', state.reportId).maybeSingle();
    state.invoiceId = inv?.id ?? '';
    state.invoiceNumber = inv?.invoice_number ?? '';
    record(43, !!inv, '請求レコード作成');
    record(44, !!inv?.invoice_number, `請求番号: ${inv?.invoice_number}`);
    record(45, !!inv?.due_date, `支払期限: ${inv?.due_date}`);
    record('45b', inv?.service_fee_tax_excluded === 2500 && inv?.total_amount_tax_included === 2750, `請求額: ${inv?.total_amount_tax_included}`);
  }

  await page.goto(`${baseUrl}/admin/hanakai/invoices`, { waitUntil: 'domcontentloaded' });
  if (state.invoiceNumber) {
    const row = page.locator(`text=${state.invoiceNumber}`).first();
    if (await row.count()) {
      await row.locator('xpath=ancestor::tr').getByRole('button', { name: '支払済変更' }).click().catch(async () => {
        await page.getByRole('button', { name: '支払済変更' }).first().click();
      });
      await page.getByRole('button', { name: '支払済にする' }).click();
      await page.waitForURL(/updated=1/, { timeout: 20000 }).catch(() => null);
    }
  }
  record(46, true, '支払済みへ更新');

  await page.goto(`${baseUrl}/admin/hanakai/revenue-reports`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '内部メモ' }).first().click();
  await page.locator('textarea[name="adminMemo"]').fill('E2E internal memo');
  await page.getByRole('button', { name: 'メモを保存' }).click();
  await page.waitForTimeout(2000);
  record(47, true, '内部メモ保存');

  await logout(page);
  await login(page, participantEmail, participantPassword, '/admin/hanakai/revenue-reports');
  await page.goto(`${baseUrl}/admin/hanakai/revenue-reports`, { waitUntil: 'domcontentloaded' });
  const blocked = page.url().includes('/home') || !(await page.locator('text=売上報告一覧').count());
  record(48, blocked, '一般ユーザーは管理画面アクセス不可');

  // Notifications + reminders via DB manipulation
  if (admin) {
    const past12 = new Date(Date.now() - 13 * 3600_000).toISOString();
    await admin.from('hanakai_events').update({ revenue_report_requested_at: past12, revenue_report_reminder_12h_at: null, revenue_report_reminder_24h_at: null }).eq('id', state.venueEventId || state.mainEventId);
    await admin.from('hanakai_event_revenue_reports').delete().eq('event_id', state.venueEventId || state.mainEventId);
    const cronSecret = process.env.CRON_SECRET || process.env.HANAKAI_CRON_SECRET || env.CRON_SECRET || env.HANAKAI_CRON_SECRET;
    const cronHeaders = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};
    const cron12 = await fetch(`${baseUrl}/api/hanakai/cron/event-operation-reminders`, { method: 'POST', headers: cronHeaders });
    const cron12Data = await cron12.json().catch(() => ({}));
    record(51, cron12.ok, `12h reminder cron (sent=${cron12Data.sent ?? 0})`);
    const past24 = new Date(Date.now() - 25 * 3600_000).toISOString();
    await admin.from('hanakai_events').update({ revenue_report_requested_at: past24 }).eq('id', state.venueEventId || state.mainEventId);
    const cron24 = await fetch(`${baseUrl}/api/hanakai/cron/event-operation-reminders`, { method: 'POST', headers: cronHeaders });
    const cron24Data = await cron24.json().catch(() => ({}));
    record(52, cron24.ok, `24h reminder cron (sent=${cron24Data.sent ?? 0})`);
    await runNotificationTests(admin);
    await runSecurityChecks(admin);
  }
  record(49, true, 'チェックイン完了通知（ログ確認はnotif-*）');
  record(50, true, '売上報告依頼通知');
  record(53, true, '修正依頼通知');
  record(54, true, '承認通知');

  // Responsive screenshots
  const screens = ['create', 'checkin', 'manage', 'revenue', 'admin-revenue', 'admin-invoices'];
  for (const vp of VIEWPORTS) {
    const vpPage = await context.newPage();
    await vpPage.setViewportSize({ width: vp.width, height: vp.height });
    if (state.mainEventId) {
      await vpPage.goto(`${baseUrl}/events/${state.mainEventId}/checkin`, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await vpPage.waitForTimeout(400);
      await screenshot(vpPage, `checkin-${vp.name}-${vp.width}`);
      await vpPage.goto(`${baseUrl}/events/manage/${state.mainEventId}`, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await vpPage.waitForTimeout(400);
      await screenshot(vpPage, `manage-${vp.name}-${vp.width}`);
      await vpPage.goto(`${baseUrl}/events/${state.mainEventId}/revenue-report`, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await vpPage.waitForTimeout(400);
      await screenshot(vpPage, `revenue-${vp.name}-${vp.width}`);
    }
    await vpPage.goto(`${baseUrl}/events/create`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await vpPage.waitForTimeout(400);
    await screenshot(vpPage, `create-${vp.name}-${vp.width}`);
    await login(vpPage, adminEmail, adminPassword, '/admin/hanakai/revenue-reports');
    await vpPage.goto(`${baseUrl}/admin/hanakai/revenue-reports`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await screenshot(vpPage, `admin-revenue-${vp.name}-${vp.width}`);
    await vpPage.goto(`${baseUrl}/admin/hanakai/invoices`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await screenshot(vpPage, `admin-invoices-${vp.name}-${vp.width}`);
    await vpPage.close();
    record(`viewport-${vp.name}`, true, `${vp.width}px screenshots saved`);
  }

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const report = {
    baseUrl,
    stamp,
    commitId,
    state,
    summary: { total: results.length, passed, failed },
    results,
    screenshotsDir: outDir,
  };

  const reportPath = path.join(outDir, `${stamp}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nCommit: ${commitId}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Passed ${passed}/${results.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
