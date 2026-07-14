#!/usr/bin/env node
/**
 * HANAKAI Connection Ver1.0 release completion E2E.
 * Usage: node scripts/e2e-v1-release-completion.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'https://hanakai.kranz.design').replace(/\/$/, '');
const label = baseUrl.includes('hanakai.kranz.design') ? 'prod' : 'local';
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-v1-release-completion');

const publicPages = [
  { name: 'landing', path: '/', must: ['イベントを見る', 'イベントを作る'] },
  { name: 'login', path: '/login', must: ['おかえりなさい', 'パスワードをお忘れの方'] },
  { name: 'forgot-password', path: '/forgot-password', must: ['再設定メールを送信'] },
  { name: 'register', path: '/register', must: ['新規登録'] },
  { name: 'events', path: '/events', must: ['イベント'] },
  { name: 'terms', path: '/terms', must: ['利用規約'] },
  { name: 'privacy', path: '/privacy', must: ['プライバシー'] },
  { name: 'contact', path: '/contact', must: ['お問い合わせ'] },
  { name: 'tokushoho', path: '/legal/tokushoho', must: ['特定商取引法'] },
  { name: 'not-found', path: '/this-route-should-404-v1', must: ['ページが見つかりません'] },
];

const blockedRoutes = [
  '/posts',
  '/lives',
  '/discover',
  '/admin/connection',
  '/chats',
  '/messages/fake',
  '/settings',
];

const dmForbidden = ['メッセージを送', 'sendMessage', 'ConnectionMessage'];

const landingForbidden = [
  'HANAKAI投稿',
  'HANAKAIコメント',
  'HANAKAIメッセージ',
  'HANAKAI応援',
  'HANAKAIライブ',
  '花を贈る',
  '投げ花',
  'コミュニティで交流',
  'アプリで交流',
  'フォローや',
  'グループ投稿',
  'ライブ配信',
  'AIが、あなたらしさを',
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

async function checkHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function countBrandCharacters(page) {
  return page.locator('[data-brand-character]').count();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const page = await browser.newPage({ viewport: viewports[0] });

  for (const p of publicPages) {
    const res = await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(500);
    const html = await page.content();
    const mustOk = p.must.every((t) => html.includes(t));
    const chars = await countBrandCharacters(page);
    await page.screenshot({ path: path.join(outDir, `mobile-${p.name}.png`), fullPage: p.name === 'landing' });
    results.push({ kind: 'public', page: p.name, status: res?.status(), mustOk, brandCharacters: chars, ok: mustOk && chars === 0 });
  }

  for (const route of blockedRoutes) {
    const res = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(400);
    const html = await page.content();
    const is404 = html.includes('ページが見つかりません') || res?.status() === 404;
    results.push({ kind: 'blocked', route, status: res?.status(), is404, ok: is404 });
  }

  await page.goto(`${baseUrl}/connections`, { waitUntil: 'domcontentloaded' });
  const connHtml = await page.content();
  const noDm = !dmForbidden.some((t) => connHtml.includes(t));
  results.push({ kind: 'dm-hidden', page: 'connections-list', noDm, ok: noDm });

  const debugRes = await page.goto(`${baseUrl}/api/debug/db-check`, { waitUntil: 'domcontentloaded' });
  const debugBody = await page.textContent('body');
  const debugBlocked = debugRes?.status() === 404 || (debugBody && debugBody.includes('not_found'));
  results.push({ kind: 'debug-api', ok: debugBlocked, status: debugRes?.status() });

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const hScroll = await checkHorizontalScroll(page);
    const landingHtml = await page.content();
    const forbiddenHits = landingForbidden.filter((t) => landingHtml.includes(t));
    await page.screenshot({ path: path.join(outDir, `${vp.name}-landing.png`) });
    results.push({
      kind: 'responsive',
      viewport: vp.name,
      hScroll,
      forbiddenHits,
      ok: !hScroll && forbiddenHits.length === 0,
    });
  }

  await browser.close();

  const summary = {
    baseUrl,
    label,
    timestamp: new Date().toISOString(),
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };

  await writeFile(path.join(outDir, 'e2e-results.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
