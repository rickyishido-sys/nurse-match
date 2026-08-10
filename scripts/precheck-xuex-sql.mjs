#!/usr/bin/env node
/**
 * READ-ONLY SQL pre-check against xuex (production) using the direct DB URL.
 * SELECT-only: no writes, no DDL, no function execution. Reads DATABASE_URL from
 * .env.xuex.secrets.local. Aborts unless the target looks like xuex. Prints no
 * secrets (only a masked fingerprint).
 *
 * Usage: node scripts/precheck-xuex-sql.mjs
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
function assertXuex(dbUrl) {
  const lower = dbUrl.toLowerCase();
  if (lower.includes('yyaz') || lower.includes('ygfxruqybcjbmved')) throw new Error('REFUSING: DATABASE_URL points at yyaz. Abort.');
  if (!lower.includes('xuex') && !lower.includes('regjgwrugiwbmxcs')) throw new Error('REFUSING: DATABASE_URL does not look like xuex.');
}
function fingerprint(dbUrl) {
  const m = dbUrl.match(/([a-z0-9]{20})/);
  return m ? `${m[1].slice(0, 4)}…${m[1].slice(-4)}` : 'unknown';
}

const report = { target: 'xuex (PRODUCTION) — READ-ONLY SQL', checks: {} };
let client;
try {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL not found in .env.xuex.secrets.local');
  assertXuex(dbUrl);
  report.connection = { fingerprint: fingerprint(dbUrl) };

  client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  // Force read-only for the whole session as an extra guard.
  await client.query('set default_transaction_read_only = on');
  report.connection.database = (await client.query('select current_database() as db')).rows[0].db;

  // Existing application status CHECK body.
  const appChk = await client.query(
    `select pg_get_constraintdef(c.oid) as def from pg_constraint c
     join pg_class t on t.oid=c.conrelid
     where t.relname='hanakai_event_applications' and c.contype='c' and pg_get_constraintdef(c.oid) ilike '%status%'`,
  );
  report.checks.app_status_check_defs = appChk.rows.map((r) => r.def);

  // Existing constraint NAME(s) on applications.status (must match the name the
  // migration drops: hanakai_event_applications_status_check).
  const appChkNames = await client.query(
    `select c.conname from pg_constraint c join pg_class t on t.oid=c.conrelid
     where t.relname='hanakai_event_applications' and c.contype='c' and pg_get_constraintdef(c.oid) ilike '%status%'`,
  );
  report.checks.app_status_check_names = appChkNames.rows.map((r) => r.conname);

  // Distinct application statuses actually present (small table).
  const st = await client.query(`select status, count(*)::int as n from hanakai_event_applications group by status order by n desc`);
  report.checks.app_status_distribution = st.rows;

  // Square payment tables should still be ABSENT before apply.
  const sqTables = await client.query(
    `select table_name from information_schema.tables where table_schema='public' and table_name = any($1)`,
    [['hanakai_square_customers','hanakai_payment_methods','hanakai_payment_consents','hanakai_participation_payments','hanakai_square_webhook_events']],
  );
  report.checks.square_tables_present = sqTables.rows.map((r) => r.table_name);

  // RPCs present (should be none of these yet).
  const rpcs = await client.query(
    `select p.proname, p.pronargs from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname in
       ('hanakai_select_participants_for_payment','hanakai_expire_overdue_participation_payments')
     order by p.proname, p.pronargs`,
  );
  report.checks.payment_rpcs_present = rpcs.rows;

  // Confirm 20260716 / 20260718 markers (already applied): event ops table + member consent cols.
  report.checks.evops_table_present = (
    await client.query(`select 1 from information_schema.tables where table_schema='public' and table_name='hanakai_event_checkins'`)
  ).rowCount > 0;
  report.checks.member_consent_cols_present = (
    await client.query(`select count(*)::int as n from information_schema.columns where table_name='hanakai_members' and column_name = any($1)`,
      [['terms_agreed_at','privacy_agreed_at','terms_version','privacy_version']])
  ).rows[0].n === 4;

  // Any trust-guard / consent triggers on members (informational).
  const trig = await client.query(
    `select tgname, c.relname from pg_trigger tg join pg_class c on c.oid=tg.tgrelid
     where not tg.tgisinternal and c.relname in ('hanakai_members','hanakai_event_applications','hanakai_events') order by c.relname, tgname`,
  );
  report.checks.triggers = trig.rows;

  // Counts (fresh, direct).
  const counts = {};
  for (const t of ['hanakai_members','hanakai_events','hanakai_event_applications']) {
    counts[t] = (await client.query(`select count(*)::int as n from ${t}`)).rows[0].n;
  }
  report.checks.counts = counts;

  report.ok = true;
} catch (e) {
  report.ok = false;
  report.error = e instanceof Error ? e.message : String(e);
} finally {
  if (client) await client.end().catch(() => {});
}

const outPath = path.join(logDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-xuex-sql-precheck.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.ok ? 0 : 1);
