#!/usr/bin/env node
/** Verify event operations migration schema */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = { ...loadEnv(path.join(root, '.env.production.local')), ...loadEnv(path.join(root, '.env.secrets.local')) };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { persistSession: false } });

const tables = [
  'hanakai_event_checkins',
  'hanakai_event_checkin_attempts',
  'hanakai_event_revenue_reports',
  'hanakai_event_revenue_documents',
  'hanakai_event_invoices',
  'hanakai_event_operation_notifications',
];

const results = [];
for (const t of tables) {
  const { error } = await admin.from(t).select('id').limit(1);
  results.push({ table: t, ok: !error, error: error?.message ?? null });
}

const { data: cols, error: colErr } = await admin.from('hanakai_events').select('checkin_code_hash, external_recruitment').limit(1);
results.push({ table: 'hanakai_events.checkin_code_hash', ok: !colErr, error: colErr?.message ?? null });

const { data: buckets } = await admin.storage.listBuckets();
const bucketOk = buckets?.some((b) => b.id === 'event-revenue-documents' && !b.public);
results.push({ table: 'storage.event-revenue-documents', ok: Boolean(bucketOk) });

const report = { ok: results.every((r) => r.ok), results };
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
