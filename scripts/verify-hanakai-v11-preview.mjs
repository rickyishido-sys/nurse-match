#!/usr/bin/env node
/**
 * Verify HANAKAI Ver1.1 on Vercel preview (uses `vercel curl` for deployment protection bypass).
 * Usage: node scripts/verify-hanakai-v11-preview.mjs [previewUrl]
 */
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const previewUrl = (process.argv[2] ?? 'https://nurse-match-beta-12wfr756x-info-10353781s-projects.vercel.app').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'hanakai-v11-preview');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) env[key] = val;
  }
  return env;
}

const env = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

function vercelFetch(urlPath) {
  const full = `${previewUrl}${urlPath}`;
  const html = execFileSync('vercel', ['curl', full], { encoding: 'utf8', cwd: root, maxBuffer: 10 * 1024 * 1024 });
  return html;
}

const results = [];
function record(id, ok, detail, extra = {}) {
  const row = { id, ok, detail, ...extra, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
}

await mkdir(outDir, { recursive: true });

const landing = vercelFetch('/');
record('1a-header-register', landing.includes('新規登録'), 'Header 新規登録 on landing');
record('1b-hero-ctas', landing.includes('イベントを見る') && landing.includes('イベントを作る'), 'Hero CTAs present');
record('1c-profile-register', landing.includes('プロフィールを作ってみる') && (landing.match(/新規登録/g) ?? []).length >= 2, 'Profile card register CTAs');
record('2-profile-image', landing.includes('profile-sample'), 'Profile sample image referenced', {
  hasWebp: landing.includes('profile-sample.webp'),
  hasJpg: landing.includes('profile-sample.jpg'),
});
await writeFile(path.join(outDir, `${stamp}-preview-landing.html`), landing.slice(0, 200000));

const events = vercelFetch('/events');
record('6-events-promo', events.includes('まだ希望のイベントがありませんか？') && events.includes('体験をリクエストする'), 'Events promo card');
await writeFile(path.join(outDir, `${stamp}-preview-events.html`), events.slice(0, 200000));

const experience = vercelFetch('/experience-request');
record('3-experience-page', experience.includes('あなたはどんな体験をしてみたいですか？'), 'Experience request page');
record('3-experience-form', experience.includes('体験リクエストを送る') && experience.includes('花'), 'Experience request form fields');
await writeFile(path.join(outDir, `${stamp}-preview-experience.html`), experience.slice(0, 200000));

const manage = vercelFetch('/manage/experience-requests');
record('5-manage-auth', manage.includes('/login') || manage.includes('おかえりなさい') || manage.includes('ログイン') || manage.includes('Redirecting'), 'Manage route requires login');
await writeFile(path.join(outDir, `${stamp}-preview-manage-redirect.html`), manage.slice(0, 100000));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (supabaseUrl && serviceRole) {
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { error: tableError } = await admin.from('experience_requests').select('id').limit(1);
  record('4-supabase-table', !tableError, tableError ? `Table probe: ${tableError.message}` : 'experience_requests table exists');

  const { count, error: countError } = await admin.from('experience_requests').select('*', { count: 'exact', head: true });
  record('4-supabase-rows', !countError, `experience_requests row count: ${count ?? 0}`);

  const uniqueCity = `Preview区${Date.now().toString().slice(-6)}`;
  const { error: insertError } = await admin.from('experience_requests').insert({
    user_id: null,
    category: ['花'],
    prefecture: '神奈川県',
    city: uniqueCity,
    preferred_day: ['土曜日'],
    age_group: '20代',
    comment: 'Preview verify insert',
  });
  record('4-supabase-insert', !insertError, insertError ? `Insert failed: ${insertError.message}` : `Inserted test row city=${uniqueCity}`);

  const { data: groupRows, error: groupError } = await admin.from('experience_requests').select('category, prefecture, city');
  const groupCounts = new Map();
  if (!groupError && groupRows) {
    for (const row of groupRows) {
      const categories = Array.isArray(row.category) ? row.category : [];
      for (const category of categories) {
        const key = `${category}\0${row.prefecture}\0${row.city}`;
        groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const found = [...groupCounts.keys()].some((k) => k.includes('花') && k.includes(uniqueCity));
  record('5-manage-data', found && !groupError, found ? 'Admin group data includes inserted request' : `Group data check failed: ${groupError?.message ?? 'not found'}`);
} else {
  record('4-supabase-table', false, 'Skipped — missing Supabase env');
}

const report = {
  previewUrl,
  stamp,
  results,
  allOk: results.every((r) => r.ok),
  note: 'HTML verified via vercel curl (deployment protection bypass). Form submit and manage detail require authenticated Playwright run.',
};
const reportPath = path.join(outDir, `${stamp}-preview-verify-report.json`);
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport: ${reportPath}`);
process.exit(report.allOk ? 0 : 1);
