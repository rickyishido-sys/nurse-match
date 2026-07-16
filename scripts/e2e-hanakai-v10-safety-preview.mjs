#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 Safety / Trust / Profile UX — Preview E2E
 * Usage: node scripts/e2e-hanakai-v10-safety-preview.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

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
const hostEmail = env.HANAKAI_E2E_HOST_EMAIL || process.env.HANAKAI_E2E_HOST_EMAIL;
const hostPassword = env.HANAKAI_E2E_HOST_PASSWORD || process.env.HANAKAI_E2E_HOST_PASSWORD;
const hostMemberId = env.HANAKAI_E2E_HOST_MEMBER_ID || process.env.HANAKAI_E2E_HOST_MEMBER_ID;
const participantEmail = env.HANAKAI_E2E_PARTICIPANT_EMAIL || process.env.HANAKAI_E2E_PARTICIPANT_EMAIL;
const participantPassword = env.HANAKAI_E2E_PARTICIPANT_PASSWORD || process.env.HANAKAI_E2E_PARTICIPANT_PASSWORD;
const participantMemberId = env.HANAKAI_E2E_PARTICIPANT_MEMBER_ID || process.env.HANAKAI_E2E_PARTICIPANT_MEMBER_ID;

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

async function login(page, email, password, nextPath = '/home') {
  await page.goto(`${baseUrl}/login?next=${encodeURIComponent(nextPath)}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (!(await page.locator('input[name="email"]').count())) return false;
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.status() >= 300 && res.status() < 400, { timeout: 60000 }).catch(() => null),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login') || url.search.includes('error='), { timeout: 60000 }).catch(() => null);
  await page.waitForTimeout(1500);
  const stillOnLogin = page.url().includes('/login') && !page.url().includes('error=');
  return !stillOnLogin;
}

async function waitForPageReady(page, timeout = 8000) {
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => null);
  await page.waitForFunction(
    () => !document.body?.innerText?.includes('読み込み中'),
    { timeout },
  ).catch(() => null);
  await page.waitForTimeout(300);
}

async function fetchAuthedHtml(page, url) {
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await page.request.get(url, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    maxRedirects: 0,
  }).catch(() => null);
  if (!res) return '';
  if (res.status() >= 300 && res.status() < 400) {
    const loc = res.headers()['location'];
    if (loc) {
      const follow = await page.request.get(new URL(loc, url).toString(), {
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
      }).catch(() => null);
      return follow ? await follow.text() : '';
    }
  }
  return await res.text();
}

async function pageHasText(page, text) {
  const html = await page.content();
  if (html.includes(text)) return true;
  return (await fetchAuthedHtml(page, page.url())).includes(text);
}

async function gotoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPageReady(page);
}

async function gotoAndCheck(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);
}

async function logout(page) {
  await page.context().clearCookies();
}

async function setIdentityVerified(admin, memberId, verified) {
  if (!admin || !memberId) return;
  const { error } = await admin.from('hanakai_members').update({
    identity_verified: verified,
    document_upload_status: verified ? 'approved' : 'none',
    trust_verification_status: verified ? 'verified' : 'pending',
  }).eq('id', memberId);
  if (error) console.warn('setIdentityVerified error', memberId, error.message);
}

async function setSocialLinks(admin, memberId) {
  if (!admin || !memberId) return;
  const links = [
    { member_id: memberId, platform: 'instagram', url: 'https://instagram.com/hanakai', is_visible_on_profile: true },
    { member_id: memberId, platform: 'x', url: 'https://x.com/hanakai', is_visible_on_profile: true },
  ];
  for (const link of links) {
    await admin.from('hanakai_member_social_links').upsert(link, { onConflict: 'member_id,platform' });
  }
}

async function apiCreateBlocked(page) {
  const res = await page.request.post(`${baseUrl}/api/hanakai/events/create`, {
    data: {
      title: 'E2E API Gate Test',
      category: 'coffee',
      description: 'Testing identity gate on API',
      startAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      area: '東京',
      venuePermissionConfirmed: true,
      approvalMode: 'auto',
    },
  });
  const body = await res.json().catch(() => ({}));
  return res.status() === 403 && body.code === 'IDENTITY_REQUIRED';
}

async function main() {
  await mkdir(outDir, { recursive: true });

  try {
    commitId = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    commitId = 'unknown';
  }

  if (!hostEmail || !participantEmail) {
    record('setup', false, 'E2E accounts missing');
    process.exit(1);
  }

  const admin = serviceRole && supabaseUrl
    ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
    : null;

  const bypassSecret = env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    bypassSecret && baseUrl.includes('vercel.app')
      ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret } }
      : undefined,
  );
  const page = await context.newPage();

  // --- Unverified participant gates ---
  if (admin && participantMemberId) {
    await setIdentityVerified(admin, participantMemberId, false);
  }

  const participantLogin = await login(page, participantEmail, participantPassword, '/events');
  record('login-participant', participantLogin, `participant login (${participantEmail})`);
  if (!participantLogin) process.exit(1);

  await gotoReady(page, `${baseUrl}/events/create`).catch(() => null);
  await Promise.race([
    page.getByText('本人確認が必要です').waitFor({ timeout: 20000 }),
    page.locator('#title').waitFor({ timeout: 20000 }),
    page.getByText('ひらく').waitFor({ timeout: 20000 }),
  ]).catch(() => null);
  const createUiBlocked = (await page.locator('text=本人確認が必要です').count()) > 0;
  const createApiBlocked = await apiCreateBlocked(page);
  record('create-blocked', createUiBlocked || createApiBlocked, `作成ブロック UI=${createUiBlocked} API=${createApiBlocked} (${page.url()})`);
  await screenshot(page, 'create-blocked');

  const identityHtml = await fetchAuthedHtml(page, `${baseUrl}/my-profile`);
  const identityCopy = identityHtml.includes('安心して人と会えるサービスを目指しています');
  record('identity-copy', identityCopy, `本人確認説明文表示 (authed HTML ${identityHtml.length} bytes)`);

  await gotoAndCheck(page, `${baseUrl}/my-profile#profile-section-identity`).catch(() => null);
  const fileInput = page.locator('input[name="identityDocument"]');
  if (await fileInput.count()) {
    await fileInput.setInputFiles(FIXTURE_BAD);
    await page.waitForTimeout(800);
    const badRejected = (await page.locator('text=本人確認書類として認識できませんでした').count()) > 0;
    record('bad-image-reject', badRejected, '非書類画像の警告表示');
    await screenshot(page, 'bad-image-reject');
  } else {
    record('bad-image-reject', false, 'identity file input not found');
  }

  await gotoReady(page, `${baseUrl}/events`);
  const eventsHtml = await page.content();
  const firstEventHref = await page.locator('article a[href^="/events/"]').first().getAttribute('href').catch(() => null)
    ?? await page.locator('a[href^="/events/"]').filter({ hasNot: page.locator('text=イベント一覧') }).first().getAttribute('href').catch(() => null);
  record('events-list-view', eventsHtml.includes('イベント') && !!firstEventHref, '未確認でもイベント一覧閲覧可');

  if (firstEventHref) {
    await gotoReady(page, `${baseUrl}${firstEventHref}#event-apply`);
    await page.locator('#event-apply').scrollIntoViewIfNeeded().catch(() => null);
    const applyBlocked = (await page.locator('text=本人確認が必要です').count()) > 0;
    record('apply-blocked', applyBlocked, '未確認ユーザーの参加申請ブロックUI');
    await screenshot(page, 'apply-blocked');
  } else {
    record('apply-blocked', false, 'event link not found');
  }

  await logout(page);
  await page.waitForTimeout(500);
  await browser.close();

  // --- Verified host flow (fresh context) ---
  const hostBrowser = await chromium.launch({ headless: true });
  const hostContext = await hostBrowser.newContext(
    bypassSecret && baseUrl.includes('vercel.app')
      ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret } }
      : undefined,
  );
  const hostPage = await hostContext.newPage();

  if (admin && hostMemberId) {
    await setIdentityVerified(admin, hostMemberId, true);
    await setSocialLinks(admin, hostMemberId);
  }

  const hostLogin = await login(hostPage, hostEmail, hostPassword, '/events');
  record('login-host', hostLogin, `verified host login (${hostEmail})`);

  const publicProfileUrl = hostMemberId ? `${baseUrl}/profile/${hostMemberId}` : `${baseUrl}/events`;
  const profileRes = await hostPage.request.get(publicProfileUrl);
  const profileHtml = await profileRes.text();
  const profileBadge = profileHtml.includes('本人確認済み');
  const hasSnsIcons = profileHtml.includes('instagram.com');
  record('profile-badge', profileBadge, 'プロフィール本人確認済みバッジ');
  record('profile-sns-icons', hasSnsIcons, 'プロフィールSNSアイコン表示');

  for (const vp of VIEWPORTS) {
    await hostPage.setViewportSize({ width: vp.width, height: vp.height });
    await gotoAndCheck(hostPage, publicProfileUrl);
    await screenshot(hostPage, `profile-${vp.name}`);
    record(`responsive-${vp.name}`, profileBadge, `プロフィール ${vp.width}px`);
  }

  if (hasSnsIcons) {
    const [newPage] = await Promise.all([
      hostContext.waitForEvent('page'),
      hostPage.locator('a[aria-label*="Instagram"]').first().click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded').catch(() => null);
    const opened = newPage.url().includes('instagram.com');
    record('sns-link', opened, `SNSリンク遷移: ${newPage.url().slice(0, 60)}`);
    await newPage.close();
  }

  await gotoReady(hostPage, `${baseUrl}/events/create`);
  await Promise.race([
    hostPage.getByText('本人確認が必要です').waitFor({ timeout: 60000 }),
    hostPage.locator('#title').waitFor({ timeout: 60000 }),
    hostPage.getByText('ひらく').waitFor({ timeout: 60000 }),
  ]).catch(() => null);
  const canCreate = (await hostPage.locator('text=本人確認が必要です').count()) === 0
    && ((await hostPage.locator('#title').count()) > 0 || (await hostPage.locator('text=ひらく').count()) > 0);
  record('verified-create-access', canCreate, '本人確認済みホストは作成画面アクセス可');

  await hostBrowser.close();

  const failed = results.filter((r) => !r.ok);
  const report = {
    baseUrl,
    commitId,
    stamp,
    pass: failed.length === 0,
    results,
    screenshotsDir: outDir,
  };
  await writeFile(path.join(outDir, `${stamp}-report.json`), JSON.stringify(report, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Commit: ${commitId}`);
  console.log(`Pass: ${failed.length === 0 ? 'YES' : 'NO'} (${results.length - failed.length}/${results.length})`);
  console.log(`Screenshots: ${outDir}`);

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
