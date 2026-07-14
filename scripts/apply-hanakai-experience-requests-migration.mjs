#!/usr/bin/env node
/**
 * Apply HANAKAI Ver1.1 experience_requests migration when table is missing.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env or .env.secrets.local
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

const fileEnv = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { error: probeError } = await admin.from('experience_requests').select('id', { count: 'exact', head: true });

if (!probeError) {
  console.log(JSON.stringify({ ok: true, action: 'already_exists' }));
  process.exit(0);
}

if (probeError.code !== '42P01' && !probeError.message?.includes('does not exist')) {
  console.error('Probe failed:', probeError.message);
  process.exit(2);
}

const sqlPath = path.join(root, 'supabase/migrations/20260715_hanakai_experience_requests.sql');
const sql = readFileSync(sqlPath, 'utf8');

const { error: rpcError } = await admin.rpc('exec_sql', { query: sql });
if (rpcError) {
  console.log(
    JSON.stringify({
      ok: false,
      action: 'manual_required',
      message:
        'experience_requests table missing. Apply supabase/migrations/20260715_hanakai_experience_requests.sql in Supabase SQL Editor.',
      rpcError: rpcError.message,
    }),
  );
  process.exit(3);
}

const { error: verifyError } = await admin.from('experience_requests').select('id', { count: 'exact', head: true });
console.log(JSON.stringify({ ok: !verifyError, action: 'applied', verifyError: verifyError?.message ?? null }));
process.exit(verifyError ? 4 : 0);
