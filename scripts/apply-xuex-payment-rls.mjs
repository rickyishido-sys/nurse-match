#!/usr/bin/env node
/**
 * PRODUCTION (xuex) apply script for supabase/migrations/
 * 20260810_hanakai_payment_tables_rls.sql — enables RLS on the 5 Square payment
 * tables and revokes anon/authenticated grants. Single BEGIN/COMMIT, ROLLBACK
 * on error. xuex-guarded. Requires CONFIRM_XUEX_APPLY=YES. No secrets printed.
 *
 * Usage: CONFIRM_XUEX_APPLY=YES node scripts/apply-xuex-payment-rls.mjs
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

const TABLES = ['hanakai_square_customers', 'hanakai_payment_methods', 'hanakai_payment_consents', 'hanakai_participation_payments', 'hanakai_square_webhook_events'];
const report = { target: 'xuex (PRODUCTION) — payment tables RLS', checks: {} };
let client;
try {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL not found in .env.xuex.secrets.local');
  assertXuex(dbUrl);
  report.connection = { fingerprint: fingerprint(dbUrl) };
  if (process.env.CONFIRM_XUEX_APPLY !== 'YES') {
    report.dry_run = true; report.note = 'Set CONFIRM_XUEX_APPLY=YES to apply.';
    console.log(JSON.stringify(report, null, 2)); process.exit(2);
  }
  const sql = readFileSync(path.join(root, 'supabase/migrations/20260810_hanakai_payment_tables_rls.sql'), 'utf8');
  client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
    report.applied = true;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw new Error(`RLS migration failed; rolled back: ${String(e.message).split('\n')[0]}`);
  }
  const rls = await client.query(`select relname, relrowsecurity from pg_class where relname = any($1) order by relname`, [TABLES]);
  report.checks.rls_enabled = Object.fromEntries(rls.rows.map((r) => [r.relname, r.relrowsecurity]));
  const grant = await client.query(
    `select c.relname, has_table_privilege('anon', c.oid, 'SELECT') as anon_sel, has_table_privilege('authenticated', c.oid, 'SELECT') as auth_sel
     from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname = any($1) order by c.relname`,
    [TABLES],
  );
  report.checks.anon_authenticated_select = Object.fromEntries(grant.rows.map((r) => [r.relname, { anon: r.anon_sel, authenticated: r.auth_sel }]));
  report.pass =
    TABLES.every((t) => report.checks.rls_enabled[t] === true) &&
    TABLES.every((t) => report.checks.anon_authenticated_select[t].anon === false && report.checks.anon_authenticated_select[t].authenticated === false);
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.pass = false;
} finally {
  if (client) await client.end().catch(() => {});
}
const outPath = path.join(logDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-xuex-payment-rls.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
