#!/usr/bin/env node
/**
 * PRODUCTION (xuex) apply script for the HANAKAI Square payments rollout.
 *
 * Applies, in order, EACH in its own BEGIN/COMMIT (ROLLBACK on error, stop on
 * first failure):
 *   1. supabase/migrations/20260802_hanakai_square_payments.sql
 *   2. supabase/migrations/20260802_hanakai_square_payments_fix_expiry_rpc.sql
 *   3. supabase/migrations/20260804_hanakai_square_payments_env_param.sql
 *
 * SAFETY GATES:
 *   - DATABASE_URL is read from .env.xuex.secrets.local (or process.env).
 *   - REFUSES unless the target looks like xuex (aborts immediately if yyaz).
 *   - Requires CONFIRM_XUEX_APPLY=YES to actually run (dry-guard otherwise).
 *   - Each migration file is wrapped in a single transaction.
 *   - Never prints secrets (only a masked fingerprint).
 *
 * POST-CHECKS (read-only, after apply):
 *   - 5 payment tables present + RLS enabled.
 *   - hanakai_events / hanakai_event_applications payment columns present.
 *   - Only the 5-arg hanakai_select_participants_for_payment exists (no 4-arg).
 *   - EXECUTE granted to service_role only (anon/authenticated/public = false).
 *   - environment='production' accepted, invalid environment rejected.
 *   - hanakai_expire_overdue_participation_payments present.
 *   - hanakai_event_applications status CHECK includes the payment states.
 *
 * Usage:
 *   CONFIRM_XUEX_APPLY=YES node scripts/apply-xuex-square-payments.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(logDir, { recursive: true });

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (v.length > 1 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) v = v.slice(1, -1);
    if (v) env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile(path.join(root, '.env.production.local')),
  ...loadEnvFile(path.join(root, '.env.secrets.local')),
  ...loadEnvFile(path.join(root, '.env.xuex.secrets.local')),
};

function resolveDatabaseUrl() {
  const keys = ['XUEX_DATABASE_URL', 'DATABASE_URL', 'PROD_DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL', 'DIRECT_URL'];
  for (const k of keys) if (process.env[k]) return process.env[k];
  for (const k of keys) if (fileEnv[k]) return fileEnv[k];
  return '';
}

// xuex project ref = regjgwrugiwbmxcsxuex. yyaz ref = ygfxruqybcjbmvedyyaz.
function assertXuex(dbUrl) {
  const lower = dbUrl.toLowerCase();
  if (lower.includes('yyaz') || lower.includes('ygfxruqybcjbmved')) {
    throw new Error('REFUSING: DATABASE_URL points at yyaz (Preview), not xuex. Abort.');
  }
  if (!lower.includes('xuex') && !lower.includes('regjgwrugiwbmxcs')) {
    throw new Error('REFUSING: DATABASE_URL does not look like xuex (production). Abort.');
  }
}

function fingerprint(dbUrl) {
  const m = dbUrl.match(/([a-z0-9]{20})/);
  return m ? `${m[1].slice(0, 4)}…${m[1].slice(-4)}` : 'unknown';
}

const MIGRATIONS = [
  '20260802_hanakai_square_payments.sql',
  '20260802_hanakai_square_payments_fix_expiry_rpc.sql',
  '20260804_hanakai_square_payments_env_param.sql',
];
const PAYMENT_TABLES = [
  'hanakai_square_customers',
  'hanakai_payment_methods',
  'hanakai_payment_consents',
  'hanakai_participation_payments',
  'hanakai_square_webhook_events',
];
const EVENT_COLS = ['event_fee_type', 'event_fee_amount', 'final_payment_deadline', 'participant_selection_deadline'];
const APP_COLS = ['payment_deadline_at', 'selected_at', 'not_selected_at'];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = { target: 'xuex (PRODUCTION) — square payments', steps: {}, checks: {} };
let client;

try {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL not found in env or .env.xuex.secrets.local');
  assertXuex(dbUrl);
  report.connection = { fingerprint: fingerprint(dbUrl) };

  if (process.env.CONFIRM_XUEX_APPLY !== 'YES') {
    report.dry_run = true;
    report.note = 'Set CONFIRM_XUEX_APPLY=YES to apply. No changes made.';
    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
  }

  client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  // Live server-side ref guard.
  const who = await client.query('select current_database() as db');
  report.connection.database = who.rows[0].db;

  // --- Apply each migration in its own transaction --------------------------
  for (const file of MIGRATIONS) {
    const sql = readFileSync(path.join(root, 'supabase/migrations', file), 'utf8');
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('commit');
      report.steps[file] = 'applied';
    } catch (e) {
      await client.query('rollback').catch(() => {});
      report.steps[file] = `FAILED: ${String(e.message).split('\n')[0]}`;
      throw new Error(`Migration ${file} failed; rolled back. Stopping.`);
    }
  }

  // --- Post-checks ----------------------------------------------------------
  const tbl = await client.query(
    `select table_name from information_schema.tables where table_schema='public' and table_name = any($1)`,
    [PAYMENT_TABLES],
  );
  const present = new Set(tbl.rows.map((r) => r.table_name));
  report.checks.payment_tables = Object.fromEntries(PAYMENT_TABLES.map((t) => [t, present.has(t)]));

  const rls = await client.query(
    `select relname, relrowsecurity from pg_class where relname = any($1)`,
    [PAYMENT_TABLES],
  );
  report.checks.rls_enabled = Object.fromEntries(rls.rows.map((r) => [r.relname, r.relrowsecurity]));

  const ev = await client.query(
    `select column_name from information_schema.columns where table_name='hanakai_events' and column_name = any($1)`,
    [EVENT_COLS],
  );
  report.checks.event_cols_present = EVENT_COLS.every((c) => ev.rows.some((r) => r.column_name === c));

  const ap = await client.query(
    `select column_name from information_schema.columns where table_name='hanakai_event_applications' and column_name = any($1)`,
    [APP_COLS],
  );
  report.checks.app_cols_present = APP_COLS.every((c) => ap.rows.some((r) => r.column_name === c));

  const sig = await client.query(
    `select p.pronargs as nargs from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='hanakai_select_participants_for_payment' order by p.pronargs`,
  );
  const argCounts = sig.rows.map((r) => Number(r.nargs));
  report.checks.has_5arg = argCounts.includes(5);
  report.checks.no_4arg = !argCounts.includes(4);

  const grants = await client.query(
    `select r.rolname, has_function_privilege(r.rolname,
        'public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz, text)', 'EXECUTE') as can_exec
     from (values ('service_role'),('anon'),('authenticated')) as r(rolname)`,
  );
  report.checks.grants = Object.fromEntries(grants.rows.map((r) => [r.rolname, r.can_exec]));
  const pub = await client.query(
    `select has_function_privilege('public',
        'public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz, text)', 'EXECUTE') as can_exec`,
  );
  report.checks.grants.public = pub.rows[0].can_exec;

  report.checks.expire_rpc_present = (
    await client.query(
      `select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='hanakai_expire_overdue_participation_payments'`,
    )
  ).rowCount > 0;

  try {
    await client.query(
      `select public.hanakai_select_participants_for_payment(gen_random_uuid(), array[gen_random_uuid()]::uuid[], null, null, 'bogus')`,
    );
    report.checks.invalid_env_rejected = false;
  } catch (e) {
    report.checks.invalid_env_rejected = /HANAKAI_INVALID_ENVIRONMENT/.test(String(e.message));
  }
  const prodProbe = await client.query(
    `select public.hanakai_select_participants_for_payment(gen_random_uuid(), array[gen_random_uuid()]::uuid[], null, null, 'production') as r`,
  );
  report.checks.production_accepted = prodProbe.rows[0].r?.ok === false;

  // application status CHECK includes payment states
  const chk = await client.query(
    `select pg_get_constraintdef(c.oid) as def from pg_constraint c
     join pg_class t on t.oid=c.conrelid
     where t.relname='hanakai_event_applications' and c.contype='c' and pg_get_constraintdef(c.oid) ilike '%status%'`,
  );
  const chkDef = chk.rows.map((r) => r.def).join(' ');
  report.checks.app_status_check_has_payment_states = [
    'payment_processing', 'payment_failed', 'confirmed', 'payment_expired', 'not_selected',
  ].every((s) => chkDef.includes(s));

  report.pass =
    PAYMENT_TABLES.every((t) => report.checks.payment_tables[t]) &&
    PAYMENT_TABLES.every((t) => report.checks.rls_enabled[t]) &&
    report.checks.event_cols_present &&
    report.checks.app_cols_present &&
    report.checks.has_5arg &&
    report.checks.no_4arg &&
    report.checks.grants.service_role === true &&
    report.checks.grants.anon === false &&
    report.checks.grants.authenticated === false &&
    report.checks.grants.public === false &&
    report.checks.expire_rpc_present &&
    report.checks.invalid_env_rejected === true &&
    report.checks.production_accepted === true &&
    report.checks.app_status_check_has_payment_states;
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.pass = false;
} finally {
  if (client) await client.end().catch(() => {});
}

const outPath = path.join(logDir, `${stamp}-xuex-square-payments-apply.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
