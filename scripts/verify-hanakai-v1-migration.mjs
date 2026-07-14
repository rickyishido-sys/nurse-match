#!/usr/bin/env node
/**
 * Verify / probe HANAKAI v1 migration on production Supabase.
 * Loads .env.production.local automatically when present.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile('.env.production.local');
loadEnvFile('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env');
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
  const ok = !error || error.code !== '42P01' && !error.message?.includes('does not exist');
  out.probes.push({ name: p.name, ok, code: error?.code ?? null, message: error?.message ?? null });
}

console.log(JSON.stringify(out, null, 2));
const allOk = out.probes.every((p) => p.ok);
process.exit(allOk ? 0 : 2);
