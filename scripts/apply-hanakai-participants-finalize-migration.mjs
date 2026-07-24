#!/usr/bin/env node
/**
 * Apply participants finalize migration + RPC to linked Supabase (Preview DB).
 * Usage: node scripts/apply-hanakai-participants-finalize-migration.mjs
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = 'supabase/migrations/20260724_hanakai_finalize_participants_rpc.sql';
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(logDir, { recursive: true });

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
    if (v) env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const fileEnv = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(path.join(root, '.env.secrets.local')),
};

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = { stamp, sqlPath, steps: [] };

try {
  const out = execSync(`npx supabase db query --linked -f ${sqlPath}`, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
  report.steps.push({ step: 'db_query', ok: true, tail: out.slice(-500) });
} catch (e) {
  report.steps.push({
    step: 'db_query',
    ok: false,
    message: String(e.message ?? e),
    stderr: e.stderr?.toString?.().slice(-1000) ?? '',
  });
  writeFileSync(path.join(logDir, `${stamp}-participants-finalize-apply.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (url && key) {
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: colProbe, error: colErr } = await admin
    .from('hanakai_events')
    .select('participants_decided_at')
    .limit(1);
  report.columnProbe = { ok: !colErr, error: colErr?.message ?? null, sample: colProbe?.length ?? 0 };

  const { data: fnProbe, error: fnErr } = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: '00000000-0000-0000-0000-000000000000',
    p_selected_application_ids: [],
    p_decided_by_member_id: '00000000-0000-0000-0000-000000000000',
    p_site_base_url: '',
  });
  report.rpcProbe = {
    ok: !fnErr && fnProbe?.ok === false,
    error: fnErr?.message ?? null,
    result: fnProbe,
  };
}

report.pass = report.steps.every((s) => s.ok) && report.columnProbe?.ok && report.rpcProbe?.ok;
writeFileSync(path.join(logDir, `${stamp}-participants-finalize-apply.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 2);
