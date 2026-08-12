#!/usr/bin/env node
/**
 * PRODUCTION (xuex) apply script for
 * supabase/migrations/20260812_hanakai_payment_method_management.sql
 *
 * Single BEGIN/COMMIT, ROLLBACK on error. xuex-guarded.
 * Requires CONFIRM_XUEX_APPLY=YES. No secrets printed.
 *
 * Usage: CONFIRM_XUEX_APPLY=YES node scripts/apply-xuex-payment-method-management.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(logDir, { recursive: true });
const MIGRATION = 'supabase/migrations/20260812_hanakai_payment_method_management.sql';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      v.length > 1 &&
      ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    ) {
      v = v.slice(1, -1);
    }
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
  const keys = [
    'XUEX_DATABASE_URL',
    'DATABASE_URL',
    'PROD_DATABASE_URL',
    'POSTGRES_URL',
    'SUPABASE_DB_URL',
    'DIRECT_URL',
  ];
  for (const k of keys) if (process.env[k]) return process.env[k];
  for (const k of keys) if (fileEnv[k]) return fileEnv[k];
  return '';
}

function assertXuex(dbUrl) {
  const lower = dbUrl.toLowerCase();
  if (lower.includes('yyaz') || lower.includes('ygfxruqybcjbmved')) {
    throw new Error('REFUSING: DATABASE_URL points at yyaz. Abort.');
  }
  if (!lower.includes('xuex') && !lower.includes('regjgwrugiwbmxcs')) {
    throw new Error('REFUSING: DATABASE_URL does not look like xuex.');
  }
}

function fingerprint(dbUrl) {
  const m = dbUrl.match(/([a-z0-9]{20})/);
  return m ? `${m[1].slice(0, 4)}…${m[1].slice(-4)}` : 'unknown';
}

const report = {
  target: 'xuex (PRODUCTION) — payment method management',
  migration: MIGRATION,
  checks: {},
};
let client;

try {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL not found (.env.xuex.secrets.local / secrets)');
  assertXuex(dbUrl);
  report.connection = { fingerprint: fingerprint(dbUrl) };

  if (process.env.CONFIRM_XUEX_APPLY !== 'YES') {
    report.dry_run = true;
    report.note = 'Set CONFIRM_XUEX_APPLY=YES to apply.';
    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
  }

  const sql = readFileSync(path.join(root, MIGRATION), 'utf8');
  client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  report.connection.database = (await client.query('select current_database() as db')).rows[0].db;

  // Pre-apply safety reads
  const pmCount = await client.query('select count(*)::int as n from hanakai_payment_methods');
  const dupDefaults = await client.query(`
    select member_id, environment, count(*)::int as n
    from hanakai_payment_methods
    where status = 'active' and is_default = true
    group by member_id, environment
    having count(*) > 1
  `);
  report.checks.pre_payment_methods = pmCount.rows[0].n;
  report.checks.pre_duplicate_defaults = dupDefaults.rows.length;
  if (dupDefaults.rows.length > 0) {
    throw new Error('REFUSING: duplicate active defaults exist; normalize before unique index');
  }

  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
    report.applied = true;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw new Error(`Migration failed; rolled back: ${String(e.message).split('\n')[0]}`);
  }

  // Post-apply verification
  const col = await client.query(`
    select column_name, is_nullable, data_type
    from information_schema.columns
    where table_schema='public' and table_name='hanakai_event_applications'
      and column_name='payment_method_id'
  `);
  report.checks.payment_method_id = col.rows[0] || null;

  const fk = await client.query(`
    select c.conname, pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname='public' and t.relname='hanakai_event_applications'
      and c.contype='f' and pg_get_constraintdef(c.oid) ilike '%payment_method_id%'
  `);
  report.checks.fk = fk.rows;

  const idx = await client.query(`
    select indexname, indexdef from pg_indexes
    where schemaname='public'
      and indexname in (
        'uq_hanakai_payment_methods_one_default',
        'idx_hanakai_event_applications_payment_method'
      )
    order by indexname
  `);
  report.checks.indexes = idx.rows;

  const rpc = await client.query(`
    select p.proname, pg_get_function_identity_arguments(p.oid) as args,
           p.prosecdef as security_definer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='hanakai_set_default_payment_method'
  `);
  report.checks.rpc = rpc.rows;

  const grants = await client.query(`
    select grantee, privilege_type
    from information_schema.routine_privileges
    where routine_schema='public'
      and routine_name='hanakai_set_default_payment_method'
  `);
  report.checks.rpc_grants = grants.rows;

  const rls = await client.query(`
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in (
        'hanakai_payment_methods',
        'hanakai_event_applications',
        'hanakai_participation_payments',
        'hanakai_square_customers'
      )
    order by c.relname
  `);
  report.checks.rls = Object.fromEntries(rls.rows.map((r) => [r.relname, r.relrowsecurity]));

  const appCount = await client.query('select count(*)::int as n from hanakai_event_applications');
  const appNullPm = await client.query(`
    select count(*)::int as n from hanakai_event_applications where payment_method_id is null
  `);
  report.checks.applications = {
    total: appCount.rows[0].n,
    payment_method_id_null: appNullPm.rows[0].n,
  };

  report.pass =
    Boolean(report.checks.payment_method_id) &&
    report.checks.payment_method_id.is_nullable === 'YES' &&
    report.checks.fk.length >= 1 &&
    report.checks.indexes.length === 2 &&
    report.checks.rpc.length === 1 &&
    report.checks.rpc[0].security_definer === true &&
    report.checks.applications.total === report.checks.applications.payment_method_id_null;
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.pass = false;
} finally {
  if (client) await client.end().catch(() => {});
}

const outPath = path.join(
  logDir,
  `${new Date().toISOString().replace(/[:.]/g, '-')}-xuex-payment-method-management.json`,
);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
