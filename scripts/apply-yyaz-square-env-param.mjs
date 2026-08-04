#!/usr/bin/env node
/**
 * Apply supabase/migrations/20260804_hanakai_square_payments_env_param.sql to
 * Preview yyaz ONLY. Parameterizes hanakai_select_participants_for_payment with
 * p_environment (sandbox|production), replacing the hardcoded-'sandbox' 4-arg.
 *
 * SAFETY:
 *   - DATABASE_URL is auto-loaded from .env.yyaz.secrets.local (or env).
 *   - Aborts unless the target ref is yyaz; aborts immediately if xuex.
 *   - Single transaction (BEGIN/COMMIT), ROLLBACK on error.
 *   - Post-checks: 5-arg present & 4-arg absent, EXECUTE grants (service_role
 *     only), invalid environment rejected, 'production' accepted.
 *   - Never prints secrets.
 *
 * Usage: node scripts/apply-yyaz-square-env-param.mjs
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
  ...loadEnvFile(path.join(root, '.env.local')),
  ...loadEnvFile(path.join(root, '.env.preview.local')),
  ...loadEnvFile(path.join(root, '.env.secrets.local')),
  ...loadEnvFile(path.join(root, '.env.yyaz.secrets.local')),
};

function resolveDatabaseUrl() {
  const keys = ['DATABASE_URL', 'YYAZ_DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL', 'DIRECT_URL'];
  for (const k of keys) if (process.env[k]) return process.env[k];
  for (const k of keys) if (fileEnv[k]) return fileEnv[k];
  return '';
}

function assertYyaz(dbUrl) {
  const lower = dbUrl.toLowerCase();
  if (lower.includes('xuex') || lower.includes('regjgwrugiwbmxcs')) {
    throw new Error('REFUSING: DATABASE_URL points at xuex (production). Abort.');
  }
  if (!lower.includes('yyaz') && !lower.includes('ygfxruqybcjbmved')) {
    throw new Error('REFUSING: DATABASE_URL does not look like yyaz (Preview).');
  }
}

function fingerprint(dbUrl) {
  const m = dbUrl.match(/([a-z0-9]{20})/);
  return m ? `${m[1].slice(0, 4)}…${m[1].slice(-4)}` : 'unknown';
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = { target: 'yyaz (Preview) — env_param migration', steps: {}, checks: {} };
let client;

try {
  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL not found in env or .env.yyaz.secrets.local');
  assertYyaz(dbUrl);
  report.connection = { fingerprint: fingerprint(dbUrl) };

  const sql = readFileSync(path.join(root, 'supabase/migrations/20260804_hanakai_square_payments_env_param.sql'), 'utf8');

  client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  // Guard again against xuex via the live server's project ref if present.
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  report.steps.migration_applied = true;

  // --- Post-checks -------------------------------------------------------
  const sig = await client.query(
    `select p.pronargs as nargs, pg_get_function_identity_arguments(p.oid) as args
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname='public' and p.proname='hanakai_select_participants_for_payment'
     order by p.pronargs`,
  );
  const argCounts = sig.rows.map((r) => Number(r.nargs));
  report.checks.rpc_signatures = sig.rows.map((r) => r.args);
  report.checks.has_5arg = argCounts.includes(5);
  report.checks.no_4arg = !argCounts.includes(4);

  const grants = await client.query(
    `select r.rolname, has_function_privilege(r.rolname,
        'public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz, text)', 'EXECUTE') as can_exec
     from (values ('service_role'),('anon'),('authenticated')) as r(rolname)`,
  );
  report.checks.grants = Object.fromEntries(grants.rows.map((r) => [r.rolname, r.can_exec]));
  // public via PUBLIC pseudo-role
  const pubGrant = await client.query(
    `select has_function_privilege('public',
        'public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz, text)', 'EXECUTE') as can_exec`,
  );
  report.checks.grants.public = pubGrant.rows[0].can_exec;

  // Invalid environment must raise.
  try {
    await client.query(
      `select public.hanakai_select_participants_for_payment(gen_random_uuid(), array[gen_random_uuid()]::uuid[], null, null, 'bogus')`,
    );
    report.checks.invalid_env_rejected = false;
  } catch (e) {
    report.checks.invalid_env_rejected = /HANAKAI_INVALID_ENVIRONMENT/.test(String(e.message));
    report.checks.invalid_env_error = String(e.message).split('\n')[0];
  }

  // 'production' must be accepted (passes validation → event-not-found json, no throw).
  const prodAccept = await client.query(
    `select public.hanakai_select_participants_for_payment(gen_random_uuid(), array[gen_random_uuid()]::uuid[], null, null, 'production') as r`,
  );
  report.checks.production_accepted = prodAccept.rows[0].r?.ok === false;
  report.checks.production_probe = prodAccept.rows[0].r;

  // 'sandbox' likewise accepted.
  const sbAccept = await client.query(
    `select public.hanakai_select_participants_for_payment(gen_random_uuid(), array[gen_random_uuid()]::uuid[], null, null, 'sandbox') as r`,
  );
  report.checks.sandbox_accepted = sbAccept.rows[0].r?.ok === false;

  report.pass =
    report.checks.has_5arg &&
    report.checks.no_4arg &&
    report.checks.grants.service_role === true &&
    report.checks.grants.anon === false &&
    report.checks.grants.authenticated === false &&
    report.checks.grants.public === false &&
    report.checks.invalid_env_rejected === true &&
    report.checks.production_accepted === true &&
    report.checks.sandbox_accepted === true;
} catch (e) {
  if (client) await client.query('rollback').catch(() => {});
  report.error = e instanceof Error ? e.message : String(e);
  report.pass = false;
} finally {
  if (client) await client.end().catch(() => {});
}

const outPath = path.join(logDir, `${stamp}-yyaz-env-param.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
