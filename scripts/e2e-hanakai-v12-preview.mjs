#!/usr/bin/env node
/**
 * HANAKAI Ver1.2 preview E2E verification.
 * Usage: node scripts/e2e-hanakai-v12-preview.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://localhost:4173').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-v12');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const results = [];

function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} ${id}: ${detail}`);
}

async function screenshot(page, name) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const vp of VIEWPORTS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(800);

      const profileSection = page.locator('text=プロフィール（イメージ）').first();
      await profileSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const hasProfilePhoto = await page.locator('img[alt="プロフィール写真のサンプル"]').count();
      record(`${vp.name}-profile-photo`, hasProfilePhoto > 0, `profile sample image count=${hasProfilePhoto}`);

      const hasRichBio = await page.locator('text=カフェ巡りが好き').count();
      record(`${vp.name}-rich-bio`, hasRichBio > 0, `rich bio present=${hasRichBio > 0}`);

      const hasTags = await page.locator('text=旅行').count();
      record(`${vp.name}-profile-tags`, hasTags > 0, `travel tag present=${hasTags > 0}`);

      const ctaText = await page
        .locator('a')
        .filter({ hasText: /無料でプロフィールを作る|プロフィールを充実させる/ })
        .first()
        .textContent()
        .catch(() => null);
      record(
        `${vp.name}-profile-cta`,
        Boolean(ctaText),
        ctaText ? `CTA="${ctaText.trim()}"` : 'CTA not found (logged-in state may differ)',
      );

      const appMock = page.locator('text=Ver1.0でできること').first();
      await appMock.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const mockAvatars = await page.locator('section img[src*="profile-sample"]').count();
      record(`${vp.name}-mock-avatars`, mockAvatars >= 3, `mock avatar images=${mockAvatars}`);

      const eventImages = await page
        .locator('img[alt="カフェイベント"], img[alt="花と散歩イベント"], img[alt="バー交流イベント"]')
        .count();
      record(`${vp.name}-mock-event-images`, eventImages >= 2, `event category images=${eventImages}`);

      await screenshot(page, `home-${vp.name}-${vp.width}`);
    } catch (err) {
      record(`${vp.name}-error`, false, String(err));
      await screenshot(page, `home-${vp.name}-error`).catch(() => {});
    }

    await page.close();
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
