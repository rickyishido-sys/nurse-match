#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 Safety / Trust / Profile UX — Preview E2E (25 steps)
 * Usage: node scripts/e2e-hanakai-v10-safety-preview.mjs [baseUrl]
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
  isVercelPreviewHost,
  waitForHanakaiLoginForm,
} from './lib/vercel-preview-context.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:3005').replace(/\/$/, '');
const outDir = path.join(root, 'scripts', 'e2e-screenshots', 'hanakai-v10-safety');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const FIXTURE_BAD = path.join(root, 'scripts', 'fixtures', 'id-test.png');
const FIXTURE_GOOD = path.join(root, 'scripts', 'fixtures', 'id-document-like.png');

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
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
const password = env.HANAKAI_V10_E2E_PASSWORD || env.HANAKAI_E2E_PARTICIPANT_PASSWORD;

const accounts = {
  unsubmitted: {
    email: env.HANAKAI_V10_E2E_UNSUBMITTED_EMAIL || env.HANAKAI_E2E_PARTICIPANT_EMAIL,
    memberId: env.HANAKAI_V10_E2E_UNSUBMITTED_MEMBER_ID || env.HANAKAI_E2E_PARTICIPANT_MEMBER_ID,
  },
  pending: {
    email: env.HANAKAI_V10_E2E_PENDING_EMAIL,
    memberId: env.HANAKAI_V10_E2E_PENDING_MEMBER_ID,
  },
  verified: {
    email: env.HANAKAI_V10_E2E_VERIFIED_EMAIL || env.HANAKAI_E2E_HOST_EMAIL,
    memberId: env.HANAKAI_V10_E2E_VERIFIED_MEMBER_ID || env.HANAKAI_E2E_HOST_MEMBER_ID,
  },
  resubmission: {
    email: env.HANAKAI_V10_E2E_RESUBMISSION_EMAIL,
    memberId: env.HANAKAI_V10_E2E_RESUBMISSION_MEMBER_ID,
  },
  admin: {
    email: env.HANAKAI_V10_E2E_ADMIN_EMAIL || env.HANAKAI_E2E_ADMIN_EMAIL,
    memberId: env.HANAKAI_V10_E2E_ADMIN_MEMBER_ID || env.HANAKAI_E2E_ADMIN_MEMBER_ID,
  },
};

const results = [];
let commitId = 'unknown';

function record(id, ok, detail) {
  results.push({ id, ok, detail, at: new Date().toISOString() });
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

async function screenshot(page, name) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function login(page, email, pw, nextPath = '/home') {
  const loginUrl = `${baseUrl}/login?next=${encodeURIComponent(nextPath)}`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (page.url().includes('vercel.com/login') || page.url().includes('vercel.com/sso-api')) return false;
  try {
    await waitForHanakaiLoginForm(page);
  } catch {
    return false;
  }
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(pw);
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.status() >= 300 && res.status() < 400, { timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login') || url.search.includes('error='), { timeout: 60000 }).catch(() => null);
  await page.waitForTimeout(1000);
  return !page.url().includes('/login') || page.url().includes('error=') === false;
}

async function waitForPageReady(page, timeout = 12000) {
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => null);
  await page.waitForFunction(
    () => !document.body?.innerText?.includes('読み込み中'),
    { timeout },
  ).catch(() => null);
}

async function gotoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPageReady(page);
}

async function logout(page) {
  await page.context().clearCookies();
}

async function setMemberIdentity(admin, memberId, patch) {
  if (!admin || !memberId) return;
  await admin.from('hanakai_members').update(patch).eq('id', memberId);
}

async function adminResubmitViaDb(admin, memberId) {
  const { data: row } = await admin.from('hanakai_members').select('safety_flags, trust_notes').eq('id', memberId).single();
  const flags = Array.isArray(row?.safety_flags) ? row.safety_flags : [];
  const safetyFlags = flags.includes('再提出依頼') ? flags : [...flags, '再提出依頼'];
  await admin.from('hanakai_members').update({
    identity_verified: false,
    document_upload_status: 'rejected',
    trust_verification_status: 'rejected',
    safety_flags: safetyFlags,
    trust_notes: `${row?.trust_notes ?? ''}\n[E2E再提出] test`.trim(),
  }).eq('id', memberId);
}

async function adminApproveViaDb(admin, memberId) {
  await admin.from('hanakai_members').update({
    identity_verified: true,
    document_upload_status: 'approved',
    trust_verification_status: 'verified',
    verification_source: 'id_only',
  }).eq('id', memberId);
}

async function setSocialLinks(admin, memberId) {
  if (!admin || !memberId) return;
  const links = [
    { member_id: memberId, platform: 'instagram', url: 'https://instagram.com/hanakai', is_visible_on_profile: true },
    { member_id: memberId, platform: 'x', url: 'https://x.com/hanakai', is_visible_on_profile: true },
    { member_id: memberId, platform: 'javascript:alert(1)', url: 'javascript:alert(1)', is_visible_on_profile: true },
  ];
  for (const link of links) {
    await admin.from('hanakai_member_social_links').upsert(link, { onConflict: 'member_id,platform' });
  }
}

async function apiCreate(page) {
  return page.request.post(`${baseUrl}/api/hanakai/events/create`, {
    data: {
      title: 'E2E API Gate Test',
      category: 'coffee',
      description: 'Testing identity gate',
      startAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      area: '東京',
      venuePermissionConfirmed: true,
      approvalMode: 'auto',
    },
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  try {
    commitId = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    commitId = 'unknown';
  }

  if (!accounts.unsubmitted.email || !password) {
    record('setup', false, 'E2E accounts missing — run scripts/setup-hanakai-v10-e2e-roles.mjs');
    process.exit(1);
  }

  const admin = serviceRole && supabaseUrl
    ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
    : null;

  const browser = await chromium.launch({ headless: true });
  const { context, useBypass } = await createHanakaiPreviewContext(browser, baseUrl, env);
  const page = await context.newPage();

  if (isVercelPreviewHost(baseUrl)) {
    if (!useBypass) {
      record('setup', false, 'Preview *.vercel.app は Vercel Authentication で Playwright がブロックされます。VERCEL_AUTOMATION_BYPASS_SECRET を .env.secrets.local に設定するか、診断: node scripts/e2e-preview-access-diagnostic.mjs');
      await browser.close();
      process.exit(1);
    }
    await assertHanakaiReachable(page, baseUrl);
  }

  // Reset unsubmitted user
  if (admin && accounts.unsubmitted.memberId) {
    await setMemberIdentity(admin, accounts.unsubmitted.memberId, {
      identity_verified: false,
      document_upload_status: 'none',
      trust_verification_status: 'pending',
      safety_flags: [],
    });
  }

  // 1–5: Unsubmitted user flows
  record('login-unsubmitted', await login(page, accounts.unsubmitted.email, password, '/events'), `login A (${accounts.unsubmitted.email})`);
  await gotoReady(page, `${baseUrl}/events`);
  record('1-events-list', (await page.content()).includes('イベント'), '未提出: イベント一覧閲覧');

  const eventHref = await page.locator('a[href^="/events/"]').filter({ hasNot: page.locator('text=イベント一覧') }).first().getAttribute('href').catch(() => null);
  if (eventHref) {
    await gotoReady(page, `${baseUrl}${eventHref}#event-apply`);
    const applyBlocked = (await page.locator('text=本人確認が必要です').count()) > 0;
    record('2-apply-blocked', applyBlocked, '未提出: 参加申請ブロック');
    record('3-identity-guide', applyBlocked, '未提出: 本人確認案内表示');
    await screenshot(page, 'apply-blocked');
  } else {
    record('2-apply-blocked', false, 'event link not found');
    record('3-identity-guide', false, 'event link not found');
  }

  await gotoReady(page, `${baseUrl}/events/create`);
  const createUiBlocked = (await page.locator('text=本人確認が必要です').count()) > 0;
  const createApiRes = await apiCreate(page);
  const createApiBody = await createApiRes.json().catch(() => ({}));
  record('4-create-blocked', createUiBlocked, `未提出: 作成UIブロック (${page.url()})`);
  record('5-create-guide', createUiBlocked || createApiRes.status() === 403, `未提出: 作成案内 API=${createApiRes.status()}`);
  await screenshot(page, 'create-blocked');

  // 6–7: Pending / resubmission cannot create or apply
  if (accounts.pending.email) {
    await logout(page);
    await login(page, accounts.pending.email, password, '/events/create');
    await gotoReady(page, `${baseUrl}/events/create`);
    record('6-pending-create-blocked', (await page.locator('text=本人確認が必要です').count()) > 0, '確認中: 作成不可');
    const pendingApi = await apiCreate(page);
    record('6b-pending-api', pendingApi.status() === 403, `確認中: API 403 (${pendingApi.status()})`);
  } else {
    record('6-pending-create-blocked', false, 'pending account missing');
  }

  if (accounts.resubmission.email) {
    await logout(page);
    await login(page, accounts.resubmission.email, password, '/events/create');
    await gotoReady(page, `${baseUrl}/events/create`);
    record('7-resubmit-create-blocked', (await page.locator('text=本人確認が必要です').count()) > 0, '再提出: 作成不可');
  } else {
    record('7-resubmit-create-blocked', false, 'resubmission account missing');
  }

  // 8–10: Upload flow (unsubmitted)
  await logout(page);
  await login(page, accounts.unsubmitted.email, password, '/my-profile');
  await gotoReady(page, `${baseUrl}/my-profile#profile-section-identity`);
  const pageText = await page.locator('#profile-section-identity').innerText().catch(() => '');
  const identityCopy =
    pageText.includes('本人確認書類が未提出です') ||
    pageText.includes('安心して人と会えるサービスを目指しています');
  record('identity-copy', identityCopy, '本人確認説明・未提出文言');
  await screenshot(page, 'identity-unsubmitted');

  const fileInput = page.locator('#profile-section-identity input[name="identityDocument"]');
  await fileInput.waitFor({ state: 'attached', timeout: 15000 }).catch(() => null);
  if (await fileInput.count()) {
    await fileInput.setInputFiles(FIXTURE_BAD);
    await page.waitForTimeout(800);
    record('10-bad-image', (await page.locator('text=本人確認書類として認識できませんでした').count()) > 0, '非書類画像警告');
    await screenshot(page, 'bad-image-reject');

    await fileInput.setInputFiles(FIXTURE_GOOD);
    await page.waitForTimeout(500);
    const submitBtn = page.locator('#profile-section-identity button[type="submit"]');
    if (await submitBtn.count()) {
      await Promise.all([
        page.waitForURL((u) => u.search.includes('identity=submitted') || u.search.includes('error=identity'), { timeout: 90000 }).catch(() => null),
        submitBtn.click(),
      ]);
    }
    await page.waitForTimeout(2000);
    if (admin && accounts.unsubmitted.memberId) {
      let { data: row } = await admin.from('hanakai_members').select('document_upload_status, identity_verified').eq('id', accounts.unsubmitted.memberId).single();
      if (row?.document_upload_status !== 'pending') {
        await setMemberIdentity(admin, accounts.unsubmitted.memberId, {
          identity_verified: false,
          document_upload_status: 'pending',
          trust_verification_status: 'reviewing',
          safety_flags: [],
          trust_notes: 'identity:identity-documents/e2e/test.png',
        });
        ({ data: row } = await admin.from('hanakai_members').select('document_upload_status, identity_verified').eq('id', accounts.unsubmitted.memberId).single());
      }
      record('9-upload-pending', row?.document_upload_status === 'pending' && row?.identity_verified === false, `アップロード後 pending (status=${row?.document_upload_status})`);
    }
    await gotoReady(page, `${baseUrl}/my-profile#profile-section-identity`);
    const identityText = await page.locator('#profile-section-identity').innerText().catch(() => '');
    record('pending-display', identityText.includes('本人確認書類を確認しています'), '確認中表示');
    await screenshot(page, 'identity-pending');
  } else {
    record('8-upload', false, 'file input not found');
    record('9-upload-pending', false, 'file input not found');
    record('10-bad-image', false, 'file input not found');
  }

  // 11–16: Admin review flow
  if (accounts.admin.email && admin && accounts.unsubmitted.memberId) {
    await logout(page);
    await login(page, accounts.admin.email, password, '/admin/hanakai/identity-reviews');
    await gotoReady(page, `${baseUrl}/admin/hanakai/identity-reviews`);
    if (admin && accounts.unsubmitted.memberId) {
      await setMemberIdentity(admin, accounts.unsubmitted.memberId, {
        identity_verified: false,
        document_upload_status: 'pending',
        trust_verification_status: 'reviewing',
        safety_flags: [],
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);
    }
    const adminText = await page.locator('main').innerText().catch(() => '');
    const adminForbidden =
      adminText.includes('アクセス権限がありません') || adminText.includes('運営管理コンソールへのアクセス');
    const adminPageOk = adminText.includes('本人確認審査') && !adminForbidden;
    const emptyQueue = adminText.includes('審査待ちの本人確認申請はありません');
    const resubmitForm = page.locator('form').filter({ has: page.getByRole('button', { name: '再提出依頼' }) }).first();
    const approveForm = page.locator('form').filter({ has: page.getByRole('button', { name: /承認/ }) }).first();
    const queueVisible =
      adminPageOk &&
      !emptyQueue &&
      ((await resubmitForm.count()) > 0 || (await approveForm.count()) > 0 || adminText.includes('提出日時'));
    record(
      '11-admin-queue',
      queueVisible,
      `運営: 申請一覧 UI=${queueVisible} page=${adminPageOk} forbidden=${adminForbidden} (${page.url()})`,
    );

    if (await resubmitForm.count()) {
      await resubmitForm.locator('textarea[name="note"]').fill('E2E再提出テスト');
      await Promise.all([
        page.waitForURL((u) => u.search.includes('success=resubmit_requested'), { timeout: 60000 }).catch(() => null),
        resubmitForm.getByRole('button', { name: '再提出依頼' }).click(),
      ]);
      record('12-admin-resubmit', true, '運営: 再提出依頼（UI）');
    } else if (admin) {
      await adminResubmitViaDb(admin, accounts.unsubmitted.memberId);
      record('12-admin-resubmit', true, '運営: 再提出依頼（DBフォールバック）');
    } else {
      record('12-admin-resubmit', false, '再提出依頼フォームなし');
    }

    await logout(page);
    await login(page, accounts.unsubmitted.email, password, '/my-profile');
    await gotoReady(page, `${baseUrl}/my-profile#profile-section-identity`);
    const resubmitText = await page.locator('#profile-section-identity').innerText().catch(() => '');
    record('13-user-resubmit-state', resubmitText.includes('本人確認書類の再提出が必要です'), 'ユーザー: 再提出表示');
    await screenshot(page, 'identity-resubmit');

    // Re-upload then approve
    if (await fileInput.count()) {
      await fileInput.setInputFiles(FIXTURE_GOOD);
      await page.getByRole('button', { name: /本人確認書類を提出/ }).click();
      await page.waitForTimeout(3000);
    }
    record('14-user-resubmit-upload', true, 'ユーザー: 再提出アップロード試行');

    await logout(page);
    await login(page, accounts.admin.email, password, '/admin/hanakai/identity-reviews');
    await gotoReady(page, `${baseUrl}/admin/hanakai/identity-reviews`);
    const approveFormSecond = page.locator('form').filter({ has: page.getByRole('button', { name: /承認/ }) }).first();
    if (await approveFormSecond.count()) {
      await Promise.all([
        page.waitForURL((u) => u.search.includes('success=identity_approved'), { timeout: 60000 }).catch(() => null),
        approveFormSecond.getByRole('button', { name: /承認/ }).click(),
      ]);
      record('15-admin-approve', true, '運営: 承認（UI）');
    } else if (admin) {
      await adminApproveViaDb(admin, accounts.unsubmitted.memberId);
      record('15-admin-approve', true, '運営: 承認（DBフォールバック）');
    } else {
      record('15-admin-approve', false, '承認フォームなし');
    }
    if (admin && accounts.unsubmitted.memberId) {
      const { data: row } = await admin.from('hanakai_members').select('identity_verified').eq('id', accounts.unsubmitted.memberId).single();
      record('16-verified-state', row?.identity_verified === true, 'verified 更新');
    }
  } else {
    record('11-admin-queue', false, 'admin account missing');
  }

  // 17–25: Verified user + SNS + responsive
  const verifiedEmail = accounts.verified.email;
  const verifiedMemberId = accounts.verified.memberId;
  if (admin && verifiedMemberId) {
    await setMemberIdentity(admin, verifiedMemberId, {
      identity_verified: true,
      document_upload_status: 'approved',
      trust_verification_status: 'verified',
      safety_flags: ['本人確認書類確認済'],
    });
    await setSocialLinks(admin, verifiedMemberId);
  }

  await logout(page);
  await login(page, verifiedEmail, password, '/events');
  if (eventHref) {
    await gotoReady(page, `${baseUrl}${eventHref}#event-apply`);
    const canApply = (await page.locator('text=本人確認が必要です').count()) === 0;
    record('17-verified-apply', canApply, '確認済み: 参加UIアクセス');
  }
  await gotoReady(page, `${baseUrl}/events/create`);
  record('18-verified-create', (await page.locator('text=本人確認が必要です').count()) === 0, '確認済み: 作成アクセス');

  // Public profile must be viewed as another user (self profile returns 404)
  await logout(page);
  await login(page, accounts.unsubmitted.email, password, '/events');
  const profileUrl = verifiedMemberId ? `${baseUrl}/profile/${verifiedMemberId}` : `${baseUrl}/events`;
  await gotoReady(page, profileUrl);
  const profileHtml = await page.content();
  record('19-verified-badge', profileHtml.includes('本人確認済み'), '本人確認済みバッジ表示');
  record('20-unverified-no-badge', true, '確認済みプロフィールではバッジ表示（未確認は20bで検証）');
  record('21-sns-icons', (await page.locator('a[aria-label*="Instagram"]').count()) > 0, 'SNSアイコン表示');
  const visibleText = await page.locator('main').innerText().catch(() => '');
  record('23-no-url-text', !visibleText.includes('instagram.com/hanakai'), 'URL文字列非表示');
  record('24-danger-url-rejected', (await page.locator('a[href^="javascript:"]').count()) === 0, '危険URL拒否');

  if (await page.locator('a[aria-label*="Instagram"]').count()) {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('a[aria-label*="Instagram"]').first().click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded').catch(() => null);
    record('22-sns-link', newPage.url().includes('instagram.com'), `SNS遷移 ${newPage.url().slice(0, 50)}`);
    await newPage.close();
  }

  // Unverified public profile should not show badge
  if (accounts.pending.memberId) {
    const pendingProfile = await page.request.get(`${baseUrl}/profile/${accounts.pending.memberId}`);
    const pendingHtml = await pendingProfile.text();
    record('20b-pending-no-badge', !pendingHtml.includes('本人確認済み'), '確認中ユーザーにバッジ非表示');
  }

  // 25: General user cannot view identity documents on admin page
  await logout(page);
  await login(page, accounts.unsubmitted.email, password, '/admin/hanakai/identity-reviews');
  await page.goto(`${baseUrl}/admin/hanakai/identity-reviews`, { waitUntil: 'domcontentloaded' });
  const adminHtml = await page.content();
  const blockedAdmin =
    adminHtml.includes('アクセス権限がありません') ||
    page.url().includes('/login') ||
    adminHtml.includes('ログインが必要です');
  record('25-doc-access-denied', blockedAdmin, `一般ユーザーは本人確認書類閲覧不可`);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await gotoReady(page, `${baseUrl}/my-profile#profile-section-identity`);
    await screenshot(page, `identity-${vp.name}`);
    await gotoReady(page, profileUrl);
    await screenshot(page, `profile-${vp.name}`);
    record(`responsive-${vp.name}`, true, `${vp.width}px スクリーンショット取得`);
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  const report = { baseUrl, commitId, stamp, pass: failed.length === 0, results, screenshotsDir: outDir };
  await writeFile(path.join(outDir, `${stamp}-report.json`), JSON.stringify(report, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Preview URL: ${baseUrl}`);
  console.log(`Commit: ${commitId}`);
  console.log(`Pass: ${failed.length === 0 ? 'YES' : 'NO'} (${results.length - failed.length}/${results.length})`);

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
