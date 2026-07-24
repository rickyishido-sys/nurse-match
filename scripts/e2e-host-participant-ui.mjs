#!/usr/bin/env node
/**
 * Host participant selection UI smoke (390px, no 承認/却下).
 * Usage: node scripts/e2e-host-participant-ui.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = (process.argv[2] ?? process.env.HANAKAI_E2E_BASE ?? 'http://127.0.0.1:3458').replace(/\/$/, '');
const outDir = path.join(root, 'scripts/e2e-screenshots/host-participant-finalize');
mkdirSync(outDir, { recursive: true });

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(ok ? 'PASS' : 'FAIL', name, detail);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  // LP mock host flow (public, no auth)
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const hostTab = page.getByRole('button', { name: /主催者|ホスト/i }).first();
  if (await hostTab.isVisible().catch(() => false)) {
    await hostTab.click();
  }

  const footerBtn = page.getByRole('button', { name: 'このメンバーで開催する' });
  record('LP mock footer CTA present', await footerBtn.isVisible().catch(() => false));

  const rejectBtn = page.getByRole('button', { name: /却下|否認|承認/i });
  record('no approve/reject buttons in LP mock', (await rejectBtn.count()) === 0);

  await page.screenshot({ path: path.join(outDir, '390-host-selection-lp-mock.png'), fullPage: true });
  record('390px screenshot saved', true, '390-host-selection-lp-mock.png');

  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  record('no horizontal scroll at 390px', bodyWidth <= 390, `scrollWidth=${bodyWidth}`);
} catch (e) {
  record('ui smoke', false, e instanceof Error ? e.message : String(e));
} finally {
  await browser.close();
}

const report = {
  stamp: new Date().toISOString(),
  baseUrl,
  pass: results.filter((r) => r.ok).length,
  fail: results.filter((r) => !r.ok).length,
  results,
};
writeFileSync(path.join(outDir, 'ui-smoke-report.json'), JSON.stringify(report, null, 2));
console.log('\nSummary:', report.pass, 'pass,', report.fail, 'fail');
process.exit(report.fail > 0 ? 1 : 0);
