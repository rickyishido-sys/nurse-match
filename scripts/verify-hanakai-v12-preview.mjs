#!/usr/bin/env node
/**
 * Verify HANAKAI Ver1.2 on Vercel preview (uses `vercel curl` for deployment protection bypass).
 * Usage: node scripts/verify-hanakai-v12-preview.mjs [previewUrl]
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const previewUrl = (process.argv[2] ?? 'https://nurse-match-beta-gxfshe9yl-info-10353781s-projects.vercel.app').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-v12');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

function vercelFetch(urlPath) {
  const full = `${previewUrl}${urlPath}`;
  return execFileSync('vercel', ['curl', full], { encoding: 'utf8', cwd: root, maxBuffer: 10 * 1024 * 1024 });
}

const results = [];
function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

await mkdir(outDir, { recursive: true });

const landing = vercelFetch('/');
record('profile-sample-image', landing.includes('profile-sample'), 'Profile sample image on landing');
record('rich-bio', landing.includes('カフェ巡りが好き'), 'Rich profile bio sample');
record('profile-tags', landing.includes('旅行') && landing.includes('映画'), 'Profile tags including 旅行 and 映画');
record(
  'logged-out-cta',
  landing.includes('無料でプロフィールを作る') && !landing.includes('プロフィールを作ってみる'),
  'Logged-out CTA updated (no プロフィールを作ってみる)',
);
record('app-mock-section', landing.includes('華会でできること'), 'App mock section present');
record('mock-event-images', landing.includes('カフェイベント') || landing.includes('hero/mobile/cafe'), 'Event images in mock');
record('mock-profile-age', landing.includes('28歳') && landing.includes('横浜'), 'Updated profile sample metadata');
await writeFile(path.join(outDir, `${stamp}-preview-landing.html`), landing.slice(0, 250000));

const myProfile = vercelFetch('/my-profile');
record(
  'my-profile-auth',
  myProfile.includes('/login') || myProfile.includes('ログイン') || myProfile.includes('Redirecting'),
  'My profile requires auth',
);

const report = {
  previewUrl,
  commit: '0208574',
  stamp,
  summary: {
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  },
  results,
  note: 'HTML verified via vercel curl (deployment protection bypass). Visual screenshots captured locally via Playwright.',
};

const reportPath = path.join(outDir, `${stamp}-preview-verify-report.json`);
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport: ${reportPath}`);
console.log(`Passed ${report.summary.passed}/${report.summary.total}`);
if (report.summary.failed > 0) process.exit(1);
