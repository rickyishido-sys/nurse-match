#!/usr/bin/env node
/**
 * Orchestrate App Store review demo setup: investigate → dry-run → apply → verify
 * Never prints secret values.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const secrets = resolve(ROOT, '.env.secrets.local');

function run(label, args) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync('node', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function checkSecrets() {
  if (!existsSync(secrets)) {
    console.error(`Missing ${secrets}`);
    console.error('Create it with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,');
    console.error('HANAKAI_REVIEW_EMAIL, HANAKAI_REVIEW_PASSWORD,');
    console.error('HANAKAI_REVIEW_HOST_EMAIL, HANAKAI_REVIEW_HOST_PASSWORD');
    process.exit(1);
  }
  const keys = new Set(
    readFileSync(secrets, 'utf8')
      .split(/\n/)
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => l.split('=')[0].trim()),
  );
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'HANAKAI_REVIEW_EMAIL',
    'HANAKAI_REVIEW_PASSWORD',
    'HANAKAI_REVIEW_HOST_EMAIL',
    'HANAKAI_REVIEW_HOST_PASSWORD',
  ];
  const missing = required.filter((k) => !keys.has(k));
  if (missing.length) {
    console.error(`Missing keys in .env.secrets.local: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('Secrets file OK (keys present, values not shown)');
}

checkSecrets();
run('investigate', ['scripts/investigate-hanakai-review-accounts.mjs']);
run('dry-run', ['scripts/seed-hanakai-review-appstore-event.mjs', '--dry-run']);
run('apply', ['scripts/seed-hanakai-review-appstore-event.mjs', '--apply']);
run('verify', ['scripts/verify-hanakai-review-production.mjs']);
console.log('\nAll steps completed.');
