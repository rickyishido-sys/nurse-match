#!/usr/bin/env node
/**
 * HANAKAI brand logo final display verification.
 * Usage: node scripts/e2e-brand-logo.mjs [baseUrl] [--out=brand-logo-final]
 */
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const baseArg = process.argv[2]?.startsWith('--') ? undefined : process.argv[2];
const rawBase = baseArg ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:4173';
const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length) ?? 'brand-logo-final';
const useVercelCurl = rawBase.includes('vercel.app');
const baseUrl = rawBase.replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', outArg);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const viewports = [
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 900 },
];

const pages = [
  { name: 'landing', path: '/', must: ['華会', 'HANAKAI'], section: 'header-footer' },
  { name: 'login', path: '/login', must: ['おかえりなさい'], section: 'auth' },
  { name: 'register', path: '/register', must: ['新規登録'], section: 'auth' },
  { name: 'profile', path: '/register/profile', must: [], section: 'profile' },
  { name: 'events', path: '/events', must: ['体験'], section: 'events' },
  { name: 'experience-request', path: '/experience-request', must: ['体験リクエスト'], section: 'events' },
  { name: 'manage-redirect', path: '/manage', must: [], section: 'manage', expectLoginRedirect: true },
];

function hasLogoInHtml(html) {
  return (
    html.includes('hanakai-logo') ||
    html.includes('brand/hanakai-logo') ||
    html.includes('%2Fbrand%2Fhanakai-logo') ||
    html.includes('華会 HANAKAI')
  );
}

function sha256File(relPath) {
  const full = path.join(root, relPath);
  if (!existsSync(full)) return null;
  return createHash('sha256').update(readFileSync(full)).digest('hex').slice(0, 16);
}

async function discoverEventDetailPath(page) {
  await page.goto(`${baseUrl}/events`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(800);
  const href = await page.locator('a[href^="/events/"]').first().getAttribute('href').catch(() => null);
  if (href && href !== '/events/create' && !href.includes('/events/manage')) return href;
  return null;
}

async function checkHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function checkLogoAspect(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[alt="華会 HANAKAI"]')];
    if (imgs.length === 0) return { ok: false, reason: 'no-logo-img' };
    const bad = imgs.find((img) => {
      const r = img.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return true;
      const ratio = r.width / r.height;
      return ratio < 0.85 || ratio > 1.15;
    });
    return bad ? { ok: false, reason: 'aspect-distorted', rect: bad.getBoundingClientRect() } : { ok: true, count: imgs.length };
  });
}

function fetchHtml(urlPath) {
  const full = `${baseUrl}${urlPath}`;
  return execFileSync('vercel', ['curl', full], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: root });
}

async function fetchAssetOk(page, assetPath, minBytes = 500) {
  const res = await page.goto(`${baseUrl}${assetPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const buf = await res?.body();
  return { ok: Boolean(buf && buf.length >= minBytes), bytes: buf?.length ?? 0, status: res?.status() ?? 0 };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const results = [];

  const logoHash = sha256File('public/brand/hanakai-logo.png');
  const faviconHash = sha256File('public/favicon.ico');
  const iconHash = sha256File('public/icon.png');
  const appleHash = sha256File('public/apple-touch-icon.png');
  const ogHash = sha256File('public/og-image.png');
  const sameFamily = logoHash && iconHash && faviconHash;
  results.push({ kind: 'asset-local', page: 'logo-source', ok: Boolean(logoHash), hash: logoHash });
  results.push({ kind: 'asset-local', page: 'favicon', ok: Boolean(faviconHash), hash: faviconHash });
  results.push({ kind: 'asset-local', page: 'icon-512', ok: Boolean(iconHash), hash: iconHash });
  results.push({ kind: 'asset-local', page: 'apple-touch', ok: Boolean(appleHash), hash: appleHash });
  results.push({ kind: 'asset-local', page: 'og-image', ok: Boolean(ogHash), hash: ogHash });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const manifestRes = await page.goto(`${baseUrl}/manifest.webmanifest`, { waitUntil: 'domcontentloaded' });
  const manifestText = await page.textContent('body');
  const manifestOk =
    manifestRes?.status() === 200 &&
    manifestText?.includes('HANAKAI') &&
    manifestText?.includes('icon.png') &&
    (manifestText?.includes('192') || manifestText?.includes('512'));
  results.push({ kind: 'manifest', ok: manifestOk, status: manifestRes?.status() ?? 0 });

  for (const asset of [
    { name: 'favicon', path: '/favicon.ico?v=7' },
    { name: 'icon-512', path: '/icon.png?v=7' },
    { name: 'apple-touch', path: '/apple-touch-icon.png?v=7' },
    { name: 'og-image', path: '/og-image.png?v=7' },
    { name: 'brand-logo-png', path: '/brand/hanakai-logo.png' },
  ]) {
    const check = await fetchAssetOk(page, asset.path);
    results.push({ kind: 'asset-http', page: asset.name, ...check, ok: check.ok });
  }

  const eventDetailPath = await discoverEventDetailPath(page);
  const allPages = eventDetailPath
    ? [...pages, { name: 'event-detail', path: eventDetailPath, must: [], section: 'events' }]
    : pages;
  if (!eventDetailPath) {
    results.push({ kind: 'warn', page: 'event-detail', ok: false, detail: 'No event link found on /events — skipped' });
  }

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const p of allPages) {
      const id = `${vp.name}-${p.name}`;
      try {
        await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForTimeout(700);

        if (p.expectLoginRedirect) {
          const url = page.url();
          const onLogin = url.includes('/login');
          results.push({ kind: 'redirect', id, page: p.name, viewport: vp.name, ok: onLogin, url });
        }

        const html = await page.content();
        const hasLogo = hasLogoInHtml(html);
        const mustOk = p.must.every((t) => html.includes(t));
        const hScroll = await checkHorizontalScroll(page);
        const aspect = await checkLogoAspect(page);

        const shotName = `${stamp}-${vp.name}-${p.name}.png`;
        const shotPath = path.join(outDir, shotName);
        const fullPage = p.name === 'landing' || p.name === 'events';
        await page.screenshot({ path: shotPath, fullPage });

        const ok = hasLogo && mustOk && !hScroll && (aspect.ok || p.name === 'manage-redirect');
        results.push({
          kind: 'screenshot',
          id,
          viewport: vp.name,
          page: p.name,
          path: p.path,
          hasLogo,
          mustOk,
          hScroll,
          aspect,
          ok,
          screenshot: shotPath,
        });
      } catch (err) {
        results.push({ kind: 'screenshot', id, viewport: vp.name, page: p.name, ok: false, error: String(err) });
      }
    }
  }

  await browser.close();

  if (useVercelCurl) {
    for (const p of allPages.slice(0, 5)) {
      const html = fetchHtml(p.path);
      results.push({ kind: 'html-curl', page: p.name, ok: hasLogoInHtml(html) });
    }
  }

  const report = {
    baseUrl,
    stamp,
    outDir,
    logoHash,
    iconHash,
    faviconHash,
    sameFamily,
    results,
    passed: results.filter((r) => r.ok).length,
    total: results.length,
    allOk: results.filter((r) => r.kind !== 'warn').every((r) => r.ok),
  };

  const reportPath = path.join(outDir, `${stamp}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        reportPath,
        allOk: report.allOk,
        passed: report.passed,
        total: report.total,
        warnings: results.filter((r) => r.kind === 'warn').length,
        failed: results.filter((r) => !r.ok && r.kind !== 'warn').map((r) => ({ kind: r.kind, page: r.page, id: r.id })),
      },
      null,
      2,
    ),
  );
  process.exit(report.allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
