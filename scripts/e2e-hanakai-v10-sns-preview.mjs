#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 — SNS icons Preview browser verification
 * Usage: node scripts/e2e-hanakai-v10-sns-preview.mjs [baseUrl]
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
  resolveVercelBypassSecret,
  waitForHanakaiLoginForm,
} from './lib/vercel-preview-context.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:3005').replace(/\/$/, '');
const outDir = path.join(root, 'scripts', 'e2e-screenshots', 'hanakai-v10-sns-preview');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
];

const SNS_FIXTURES = [
  { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/hanakai_e2e_sns', expectHost: 'instagram.com' },
  { platform: 'threads', label: 'Threads', url: 'https://www.threads.net/@hanakai_e2e_sns', expectHost: 'threads.net' },
  { platform: 'x', label: 'X', url: 'https://x.com/hanakai_e2e_sns', expectHost: 'x.com' },
  { platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/hanakai.e2e.sns', expectHost: 'facebook.com' },
  { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@hanakai_e2e_sns', expectHost: 'tiktok.com' },
  { platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@hanakai_e2e_sns', expectHost: 'youtube.com' },
  { platform: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com/hanakai_e2e_sns', expectHost: 'pinterest.com' },
  { platform: 'note', label: 'note', url: 'https://note.com/hanakai_e2e_sns', expectHost: 'note.com' },
  { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/hanakai-e2e-sns', expectHost: 'linkedin.com' },
  { platform: 'website', label: 'Website', url: 'https://example.com', expectHost: 'example.com' },
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
  verified: {
    email: env.HANAKAI_V10_E2E_VERIFIED_EMAIL,
    memberId: env.HANAKAI_V10_E2E_VERIFIED_MEMBER_ID,
  },
  pending: {
    email: env.HANAKAI_V10_E2E_PENDING_EMAIL,
    memberId: env.HANAKAI_V10_E2E_PENDING_MEMBER_ID,
  },
  viewer: {
    email: env.HANAKAI_V10_E2E_UNSUBMITTED_EMAIL,
    memberId: env.HANAKAI_V10_E2E_UNSUBMITTED_MEMBER_ID,
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
  await page.waitForTimeout(1200);
  return !page.url().includes('/login');
}

async function gotoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => !document.body?.innerText?.includes('読み込み中'), { timeout: 12000 }).catch(() => null);
}

async function clearSocialLinks(admin, memberId) {
  await admin.from('hanakai_member_social_links').delete().eq('member_id', memberId);
}

async function seedSocialLinks(admin, memberId, links) {
  await clearSocialLinks(admin, memberId);
  for (const link of links) {
    await admin.from('hanakai_member_social_links').upsert(
      {
        member_id: memberId,
        platform: link.platform,
        url: link.url,
        is_visible_on_profile: link.isVisibleOnProfile ?? true,
      },
      { onConflict: 'member_id,platform' },
    );
  }
}

function snsIconLocator(page, label) {
  return page.locator(`a[aria-label="${label}（新しいタブで開く）"]`);
}

async function assertNoUrlStrings(page, forbiddenFragments) {
  const text = await page.locator('main').innerText().catch(() => '');
  const leaked = forbiddenFragments.filter((f) => text.includes(f));
  return leaked.length === 0;
}

async function assertOpenedInNewTab(newPage, item) {
  await newPage.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => null);
  await newPage.waitForTimeout(1500);
  const url = newPage.url();
  if (item.platform === 'threads') {
    return /threads\.(net|com)/i.test(url);
  }
  return url.includes(item.expectHost);
}

async function verifyProfileSns(page, context, { mode, memberId, expectIcons, forbiddenUrlFragments, vp }) {
  const publicUrl = `${baseUrl}/profile/${memberId}`;
  const ownUrl = `${baseUrl}/my-profile`;

  if (mode === 'public') {
    await gotoReady(page, publicUrl);
  } else {
    await gotoReady(page, ownUrl);
  }

  await screenshot(page, `${mode}-profile-${vp.name}`);

  const iconCount = await page.locator('a[aria-label*="新しいタブで開く"]').count();
  record(`${mode}-${vp.name}-icon-count`, iconCount === expectIcons.length, `${mode} ${vp.width}px icons=${iconCount} expected=${expectIcons.length}`);

  const noUrls = await assertNoUrlStrings(page, forbiddenUrlFragments);
  record(`${mode}-${vp.name}-no-url-text`, noUrls, `${mode} ${vp.width}px URL文字列非表示`);

  const noDanger = (await page.locator('a[href^="javascript:"]').count()) === 0;
  record(`${mode}-${vp.name}-no-danger`, noDanger, `${mode} ${vp.width}px 危険URL拒否`);

  for (const item of expectIcons) {
    const loc = snsIconLocator(page, item.label);
    const visible = (await loc.count()) > 0;
    record(`${mode}-${vp.name}-label-${item.platform}`, visible, `${item.label} アイコン表示`);

    if (visible && vp.name === '390') {
      const href = await loc.first().getAttribute('href');
      const hrefOk = Boolean(href && href.startsWith('https://') && href.includes(item.expectHost.replace('www.', '')));
      record(`${mode}-href-${item.platform}`, hrefOk, `${item.label} href 正規化`);

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        loc.first().click(),
      ]);
      const openedOk = await assertOpenedInNewTab(newPage, item);
      record(`${mode}-open-${item.platform}`, openedOk, `${item.label} 新規タブ遷移`);
      await newPage.close();
    }
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  try {
    commitId = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    commitId = 'unknown';
  }

  if (!accounts.verified.email || !password || !accounts.verified.memberId) {
    record('setup', false, 'E2E accounts missing');
    process.exit(1);
  }

  if (isVercelPreviewHost(baseUrl) && !resolveVercelBypassSecret(env)) {
    record('setup', false, 'VERCEL_AUTOMATION_BYPASS_SECRET not configured in .env.secrets.local');
    process.exit(1);
  }

  const admin = serviceRole && supabaseUrl
    ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
    : null;
  if (!admin) {
    record('setup', false, 'SUPABASE_SERVICE_ROLE_KEY required for SNS seeding');
    process.exit(1);
  }

  const visibleLinks = SNS_FIXTURES.map((f) => ({
    platform: f.platform,
    url: f.url,
    isVisibleOnProfile: true,
  }));
  visibleLinks.push({
    platform: 'other',
    url: 'javascript:alert(1)',
    isVisibleOnProfile: true,
  });

  await seedSocialLinks(admin, accounts.verified.memberId, visibleLinks);
  if (accounts.pending.memberId) {
    await clearSocialLinks(admin, accounts.pending.memberId);
  }

  const browser = await chromium.launch({ headless: true });
  const { context } = await createHanakaiPreviewContext(browser, baseUrl, env);
  const page = await context.newPage();

  if (isVercelPreviewHost(baseUrl)) {
    await assertHanakaiReachable(page, baseUrl);
  }

  // Public profile (viewer = unsubmitted)
  record('login-viewer', await login(page, accounts.viewer.email, password, '/events'), 'viewer login');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await verifyProfileSns(page, context, {
      mode: 'public',
      memberId: accounts.verified.memberId,
      expectIcons: SNS_FIXTURES,
      forbiddenUrlFragments: SNS_FIXTURES.map((f) => f.url.replace('https://', '')),
      vp,
    });
  }

  // Own profile (verified user)
  await page.context().clearCookies();
  record('login-owner', await login(page, accounts.verified.email, password, '/my-profile'), 'owner login');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await verifyProfileSns(page, context, {
      mode: 'own',
      memberId: accounts.verified.memberId,
      expectIcons: SNS_FIXTURES,
      forbiddenUrlFragments: SNS_FIXTURES.map((f) => f.url.replace('https://', '')),
      vp,
    });
  }

  // No SNS registered — pending user public profile
  if (accounts.pending.memberId) {
    await page.context().clearCookies();
    await login(page, accounts.viewer.email, password, '/events');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoReady(page, `${baseUrl}/profile/${accounts.pending.memberId}`);
      await screenshot(page, `no-sns-public-${vp.name}`);
      const iconCount = await page.locator('a[aria-label*="新しいタブで開く"]').count();
      record(`no-sns-${vp.name}-icons`, iconCount === 0, `SNS未登録 ${vp.width}px アイコン非表示`);
      const mainHtml = await page.locator('main').innerHTML().catch(() => '');
      const noEmptySnsBlock = !mainHtml.includes('>SNS<') && !mainHtml.includes('MemberVisibleSocialLinks');
      record(`no-sns-${vp.name}-no-empty`, noEmptySnsBlock, `SNS未登録 ${vp.width}px 空領域なし`);
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  const report = { baseUrl, commitId, stamp, pass: failed.length === 0, results, screenshotsDir: outDir };
  await writeFile(path.join(outDir, `${stamp}-report.json`), JSON.stringify(report, null, 2));

  console.log('\n--- SNS Summary ---');
  console.log(`Preview URL: ${baseUrl}`);
  console.log(`Pass: ${failed.length === 0 ? 'YES' : 'NO'} (${results.length - failed.length}/${results.length})`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
