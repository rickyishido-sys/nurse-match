#!/usr/bin/env node
/**
 * Preview access diagnostic — HTTP status, redirects, headers (no secrets logged).
 * Usage: node scripts/e2e-preview-access-diagnostic.mjs [url]
 */
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target =
  (process.argv[2] ?? 'https://nurse-match-beta-nzlwr6ay4-info-10353781s-projects.vercel.app').replace(/\/$/, '') +
  '/login';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(__dirname, 'e2e-screenshots', 'hanakai-v10-safety');

function curlHeaders(url) {
  try {
    const raw = execSync(`curl -sI "${url}"`, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    const lines = raw.split('\n');
    const statusLine = lines[0]?.trim() ?? '';
    const headers = {};
    for (const line of lines.slice(1)) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
    return { statusLine, headers };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function playwrightTrace(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const documents = [];

  page.on('response', (res) => {
    if (res.request().resourceType() !== 'document') return;
    const h = res.headers();
    documents.push({
      url: res.url(),
      status: res.status(),
      location: h.location ?? null,
      server: h.server ?? null,
      xVercelId: h['x-vercel-id'] ?? null,
      setCookie: h['set-cookie'] ? '_vercel_sso_nonce (or other) present' : null,
    });
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
  const finalUrl = page.url();
  const hanakaiLogin =
    (await page.locator('text=おかえりなさい').count()) > 0 &&
    (await page.locator('input[name="password"]').count()) > 0;
  const vercelLogin = finalUrl.includes('vercel.com/login') || (await page.locator('text=Log in to Vercel').count()) > 0;

  await browser.close();
  return { finalUrl, hanakaiLogin, vercelLogin, documents };
}

const curl = curlHeaders(target);
const pw = await playwrightTrace(target);

const report = {
  stamp,
  target,
  curl: {
    statusLine: curl.statusLine ?? null,
    location: curl.headers?.location ?? null,
    server: curl.headers?.server ?? null,
    xVercelId: curl.headers?.['x-vercel-id'] ?? null,
    setCookie: curl.headers?.['set-cookie'] ? '(present)' : null,
  },
  playwright: pw,
  conclusion:
    curl.headers?.location?.includes('vercel.com/sso-api') || pw.vercelLogin
      ? 'Vercel Deployment Protection (Vercel Authentication) blocks unauthenticated clients on *.vercel.app. Browser access without visible SSO usually means an active Vercel team session cookie. Playwright needs Protection Bypass header or an authenticated bypass path.'
      : pw.hanakaiLogin
        ? 'HANAKAI reachable without Vercel SSO redirect.'
        : 'Unknown — inspect documents array.',
};

await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${stamp}-preview-access-diagnostic.json`);
await writeFile(outPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
console.log(`\nReport: ${outPath}`);
