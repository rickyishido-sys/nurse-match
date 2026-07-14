#!/usr/bin/env node
/**
 * Verify / probe HANAKAI v1 migration on production Supabase.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Local setup:
 *   1. Copy service_role key from Supabase Dashboard → Settings → API
 *   2. Add to .env.local (Vercel env pull leaves this key empty)
 *   3. node scripts/verify-hanakai-v1-migration.mjs
 *
 * Optional:
 *   node scripts/verify-hanakai-v1-migration.mjs --env-file=.env.local
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

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

function pickEnv(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='))?.slice('--env-file='.length);
const extraEnvFile = envFileArg ? path.resolve(process.cwd(), envFileArg) : null;

const envFiles = [
  path.join(root, '.env.production.local'),
  path.join(root, '.env.vercel.prod.local'),
  path.join(root, '.env.local'),
  path.join(root, '.env.secrets.local'),
  ...(extraEnvFile ? [extraEnvFile] : []),
];

const fileEnv = {};
for (const file of envFiles) {
  Object.assign(fileEnv, loadEnv(file));
}

const url = pickEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, fileEnv.NEXT_PUBLIC_SUPABASE_URL);
const key = pickEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, fileEnv.SUPABASE_SERVICE_ROLE_KEY);

if (!url || !key) {
  console.error('Missing Supabase env');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Checked files:');
  for (const file of envFiles) {
    const parsed = loadEnv(file);
    console.error(
      `  - ${file}: ${existsSync(file) ? 'exists' : 'missing'} | url=${Boolean(parsed.NEXT_PUBLIC_SUPABASE_URL)} serviceRole=${Boolean(parsed.SUPABASE_SERVICE_ROLE_KEY)}`,
    );
  }
  console.error('Shell env:', {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
  console.error('');
  console.error('Note: vercel env pull / vercel env run do not populate SUPABASE_SERVICE_ROLE_KEY locally.');
  console.error('Add the service_role key from Supabase Dashboard → Settings → API to .env.local or .env.secrets.local, then rerun.');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const probes = [
  { name: 'hanakai_member_blocks', fn: () => admin.from('hanakai_member_blocks').select('id', { count: 'exact', head: true }) },
  { name: 'hanakai_event_applications.cancelled_at', fn: () => admin.from('hanakai_event_applications').select('cancelled_at').limit(1) },
  { name: 'hanakai_events.cancelled_at', fn: () => admin.from('hanakai_events').select('cancelled_at').limit(1) },
];

const out = { url: url.replace(/https:\/\/([^.]+).*/, 'https://$1.supabase.co'), probes: [] };

for (const p of probes) {
  const { error } = await p.fn();
  const ok = !error || (error.code !== '42P01' && !error.message?.includes('does not exist'));
  out.probes.push({ name: p.name, ok, code: error?.code ?? null, message: error?.message ?? null });
}

console.log(JSON.stringify(out, null, 2));
const allOk = out.probes.every((p) => p.ok);
process.exit(allOk ? 0 : 2);
