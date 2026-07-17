#!/usr/bin/env node
/**
 * Run HANAKAI Ver1.0 Preview E2E (32/32) + SNS browser verification
 * Usage: node scripts/run-hanakai-v10-preview-full.mjs [previewUrl]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const previewUrl = (
  process.argv[2] ??
  process.env.HANAKAI_E2E_BASE ??
  'https://nurse-match-beta-nzlwr6ay4-info-10353781s-projects.vercel.app'
).replace(/\/$/, '');

function hasBypassSecret() {
  const secretsPath = path.join(root, '.env.secrets.local');
  if (!existsSync(secretsPath)) return false;
  return readFileSync(secretsPath, 'utf8')
    .split('\n')
    .some((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('VERCEL_AUTOMATION_BYPASS_SECRET=')) return false;
      return trimmed.slice('VERCEL_AUTOMATION_BYPASS_SECRET='.length).trim().length > 0;
    });
}

function run(script) {
  const res = spawnSync('node', [path.join(root, 'scripts', script), previewUrl], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  return res.status ?? 1;
}

if (!hasBypassSecret()) {
  console.error('VERCEL_AUTOMATION_BYPASS_SECRET is not set in .env.secrets.local');
  process.exit(1);
}

console.log(`Preview target: ${previewUrl}\n`);

const safetyCode = run('e2e-hanakai-v10-safety-preview.mjs');
if (safetyCode !== 0) process.exit(safetyCode);

const snsCode = run('e2e-hanakai-v10-sns-preview.mjs');
process.exit(snsCode);
