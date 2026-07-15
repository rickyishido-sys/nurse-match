#!/usr/bin/env node
/**
 * HANAKAI Production final E2E verification.
 * Usage: node scripts/e2e-hanakai-production-final.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-production-final');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'events', path: '/events' },
  { name: 'experience-request', path: '/experience-request' },
  { name: 'login', path: '/login' },
  { name: 'my-profile-redirect', path: '/my-profile', expectLogin: true },
];

const results = [];

function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

function sha256File(relPath) {
  const full = path.join(root, relPath);
  if (!existsSync(full)) return null;
  return createHash('sha256').update(readFileSync(full)).digest('hex').slice(0, 16);
}

function hasLogoInHtml(html) {
  return (
    html.includes('hanakai-logo') ||
    html.includes('brand/hanakai-logo') ||
    html.includes('%2Fbrand%2Fhanakai-logo') ||
    html.includes('華会 HANAKAI')
  );
}

async function checkHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function fetchAssetOk(page, assetPath, minBytes = 500) {
  const res = await page.goto(`${baseUrl}${assetPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const buf = await res?.body();
  return { ok: Boolean(buf && buf.length >= minBytes), bytes: buf?.length ?? 0, status: res?.status() ?? 0 };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const manifestRes = await page.goto(`${baseUrl}/manifest.webmanifest`, { waitUntil: 'domcontentloaded' });
  const manifestText = await page.textContent('body');
  const manifestOk =
    manifestRes?.status() === 200 &&
    manifestText?.includes('HANAKAI') &&
    manifestText?.includes('icon.png');
  record('pwa-manifest', manifestOk, `manifest status=${manifestRes?.status() ?? 0}`);

  for (const asset of [
    { id: 'favicon', path: '/favicon.ico' },
    { id: 'icon-512', path: '/icon.png' },
    { id: 'apple-touch', path: '/apple-touch-icon.png' },
    { id: 'brand-logo', path: '/brand/hanakai-logo.png' },
  ]) {
    const check = await fetchAssetOk(page, asset.path);
    record(`asset-${asset.id}`, check.ok, `${asset.path} bytes=${check.bytes} status=${check.status}`);
  }

  record('asset-local-logo', Boolean(sha256File('public/brand/hanakai-logo.png')), 'local logo hash present');

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const p of PAGES) {
      try {
        await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForTimeout(800);

        const html = await page.content();
        const hScroll = await checkHorizontalScroll(page);
        record(`${vp.name}-${p.name}-hscroll`, !hScroll, hScroll ? 'horizontal scroll detected' : 'no horizontal scroll');

        if (p.name === 'landing') {
          record(`${vp.name}-logo`, hasLogoInHtml(html), 'brand logo in HTML');
          record(
            `${vp.name}-cta`,
            html.includes('無料でプロフィールを作る') && !html.includes('プロフィールを作ってみる'),
            'logged-out profile CTA',
          );
          record(`${vp.name}-profile-card`, html.includes('あなたのプロフィール'), 'profile card heading');
          record(`${vp.name}-profile-photo`, html.includes('profile-sample'), 'profile sample image');
          record(`${vp.name}-rich-bio`, html.includes('カフェ巡りが好き'), 'rich profile bio');
          record(`${vp.name}-app-mock-heading`, html.includes('華会でできること') && !html.includes('Ver1.0でできること'), 'user-facing app mock heading');
          record(`${vp.name}-no-dev-copy`, !html.includes('プロフィール（イメージ）') && !html.includes('UIサンプル'), 'no developer-facing copy');
        }

        if (p.name === 'events') {
          record(`${vp.name}-experience-promo`, html.includes('体験をリクエストする') || html.includes('体験リクエスト'), 'experience request promo on events');
        }

        if (p.name === 'experience-request') {
          record(`${vp.name}-experience-page`, html.includes('体験リクエスト') || html.includes('体験をリクエスト'), 'experience request page');
        }

        if (p.name === 'my-profile-redirect' && p.expectLogin) {
          const onLogin = page.url().includes('/login');
          record(`${vp.name}-identity-entry`, onLogin, onLogin ? 'my-profile redirects to login' : `unexpected url=${page.url()}`);
        }

        if (p.name === 'landing' || p.name === 'events') {
          await page.screenshot({
            path: path.join(outDir, `${stamp}-${vp.name}-${p.name}.png`),
            fullPage: true,
          });
        }
      } catch (err) {
        record(`${vp.name}-${p.name}-error`, false, String(err));
      }
    }

    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const faqHtml = await page.content();
    record(`${vp.name}-identity-faq`, faqHtml.includes('本人確認'), 'identity verification mentioned on site');
  }

  await browser.close();

  const report = {
    baseUrl,
    stamp,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    results,
  };

  const reportPath = path.join(outDir, `${stamp}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(`Passed ${report.summary.passed}/${report.summary.total}`);
  if (report.summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
