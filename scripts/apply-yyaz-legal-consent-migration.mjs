#!/usr/bin/env node
/**
 * Apply the remaining missing HANAKAI migration required for the UI apply flow on
 * Preview yyaz (the deployed code reads these columns; without them every member
 * is treated as "profile incomplete" and applications silently redirect):
 *
 *   supabase/migrations/20260718_hanakai_legal_consent_rls.sql
 *
 * Adds hanakai_members legal-consent audit columns
 *   (terms_agreed_at, privacy_agreed_at, terms_version, privacy_version)
 * and the member trust-column self-update guard trigger. The unrelated
 * hanakai_account_deletion_requests ALTER is guarded (that table does not exist
 * on yyaz) so it is applied only if the table is present.
 *
 * Safety:
 *  - yyaz-only (refuses xuex / any non-yyaz fingerprint)
 *  - DATABASE_URL is read from process.env ONLY (never args, never logged)
 *  - single BEGIN/COMMIT, ROLLBACK on error
 *  - pre/post checks incl. regression guard on the apps status constraint and
 *    row-count invariance on core tables
 *
 * DATABASE_URL is auto-loaded (no need to export it every time) from, in order:
 *   process.env  →  .env.yyaz.secrets.local  →  .env.secrets.local
 *   →  .env.preview.local  →  .env.local
 * Accepted keys: DATABASE_URL, YYAZ_DATABASE_URL, POSTGRES_URL, SUPABASE_DB_URL, DIRECT_URL.
 *
 * Usage (run on your Mac terminal, once DATABASE_URL is saved in .env.yyaz.secrets.local):
 *   node scripts/apply-yyaz-legal-consent-migration.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
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

// Later files do NOT override earlier ones (process.env wins; then yyaz secrets).
const fileEnv = {
  ...loadEnvFile(path.join(root, '.env.local')),
  ...loadEnvFile(path.join(root, '.env.preview.local')),
  ...loadEnvFile(path.join(root, '.env.secrets.local')),
  ...loadEnvFile(path.join(root, '.env.yyaz.secrets.local')),
};

function resolveDatabaseUrl() {
  const keys = ['DATABASE_URL', 'YYAZ_DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL', 'DIRECT_URL'];
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  for (const k of keys) {
    if (fileEnv[k]) return fileEnv[k];
  }
  return '';
}

const NEW_MEMBER_COLUMNS = ['terms_agreed_at', 'privacy_agreed_at', 'terms_version', 'privacy_version'];
const CORE_TABLES = ['hanakai_members', 'hanakai_events', 'hanakai_event_applications'];

// Faithful to 20260718_hanakai_legal_consent_rls.sql, with the deletion-requests
// ALTER guarded behind a table-existence check.
const SQL = `
alter table public.hanakai_members
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_version text;

create or replace function public.hanakai_guard_member_trust_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if new.identity_verified is distinct from old.identity_verified
     or new.document_upload_status is distinct from old.document_upload_status
     or new.trust_verification_status is distinct from old.trust_verification_status
     or new.trust_verification_date is distinct from old.trust_verification_date
     or new.identity_verification_date is distinct from old.identity_verification_date
     or new.verification_source is distinct from old.verification_source
     or new.identity_verification_method is distinct from old.identity_verification_method
     or new.external_verification_ref is distinct from old.external_verification_ref
     or coalesce(new.safety_flags, '{}'::text[]) is distinct from coalesce(old.safety_flags, '{}'::text[])
  then
    raise exception 'HANAKAI_MEMBER_TRUST_UPDATE_FORBIDDEN';
  end if;

  return new;
end;
$$;

drop trigger if exists hanakai_members_guard_trust on public.hanakai_members;
create trigger hanakai_members_guard_trust
  before update on public.hanakai_members
  for each row
  execute function public.hanakai_guard_member_trust_columns();

do $$
begin
  if to_regclass('public.hanakai_account_deletion_requests') is not null then
    alter table public.hanakai_account_deletion_requests
      drop constraint if exists hanakai_account_deletion_requests_auth_user_id_fkey;
    begin
      alter table public.hanakai_account_deletion_requests
        alter column auth_user_id drop not null;
    exception when undefined_column then null;
    end;
  end if;
end $$;
`;

function refFingerprint(url) {
  if (!url) return null;
  const s = String(url);
  if (s.includes('xuex') || s.includes('regjgwrugiwbmxcsxuex')) return 'xuex';
  if (s.includes('yyaz') || s.includes('ygfxruqybcjbmvedyyaz')) return 'yyaz';
  const m = s.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+)@/i);
  if (m) return m[1].slice(-4);
  return null;
}
function redact(text, dbUrl) {
  let out = String(text ?? '');
  if (dbUrl) out = out.split(dbUrl).join('[REDACTED_DATABASE_URL]');
  return out.replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[REDACTED_DATABASE_URL]');
}
function assertYyaz(dbUrl) {
  if (!dbUrl) throw new Error('DATABASE_URL is required (set via process.env only)');
  const fp = refFingerprint(dbUrl);
  if (fp === 'xuex' || dbUrl.includes('xuex')) throw new Error('Refusing: connection target is xuex (production)');
  if (fp !== 'yyaz') throw new Error(`Refusing: DATABASE_URL fingerprint is ${fp ?? 'UNKNOWN'}, expected yyaz`);
}
async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `select exists (select 1 from information_schema.columns
      where table_schema='public' and table_name=$1 and column_name=$2) as ok`,
    [table, column],
  );
  return rows[0]?.ok === true;
}
async function appsStatusConstraintDef(client) {
  const { rows } = await client.query(
    `select pg_get_constraintdef(c.oid) as def from pg_constraint c
     where c.conrelid = 'public.hanakai_event_applications'::regclass
       and c.conname = 'hanakai_event_applications_status_check' limit 1`,
  );
  return rows[0]?.def ?? null;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = {
  stamp, targetRef: 'yyaz',
  migration: 'supabase/migrations/20260718_hanakai_legal_consent_rls.sql (guarded)',
  gitSha: execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim(),
  connection: {}, preCheck: {}, apply: { ok: false }, postCheck: {}, pass: false,
};

let dbUrl = '';
let client;
try {
  dbUrl = resolveDatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL not found. Add a line like ' +
        "DATABASE_URL='postgresql://postgres.<yyaz-ref>:<password>@<host>:5432/postgres' " +
        'to .env.yyaz.secrets.local (gitignored), then re-run.',
    );
  }
  assertYyaz(dbUrl);
  report.connection = { fingerprint: refFingerprint(dbUrl) };

  client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // ---- Pre-check ----
  report.preCheck.consent_cols_before = {};
  for (const c of NEW_MEMBER_COLUMNS) report.preCheck.consent_cols_before[c] = await columnExists(client, 'hanakai_members', c);
  report.preCheck.apps_status_constraint_before = await appsStatusConstraintDef(client);
  const rowCountsBefore = {};
  for (const t of CORE_TABLES) {
    const { rows } = await client.query(`select count(*)::bigint as n from public.${t}`);
    rowCountsBefore[t] = rows[0]?.n ?? null;
  }
  report.preCheck.rowCountsBefore = rowCountsBefore;

  // ---- Apply (single transaction) ----
  await client.query('BEGIN');
  try {
    await client.query(SQL);
    await client.query('COMMIT');
    report.apply = { ok: true, method: 'pg_client_transaction' };
  } catch (migErr) {
    await client.query('ROLLBACK');
    throw migErr;
  }

  // ---- Post-check ----
  const missing = [];
  for (const c of NEW_MEMBER_COLUMNS) if (!(await columnExists(client, 'hanakai_members', c))) missing.push(c);
  report.postCheck.consent_cols_missing_after = missing;

  const { rows: trg } = await client.query(
    `select tgname from pg_trigger where tgrelid='public.hanakai_members'::regclass and tgname='hanakai_members_guard_trust'`,
  );
  report.postCheck.trust_guard_trigger_present = trg.length > 0;

  const appsDefAfter = await appsStatusConstraintDef(client);
  report.postCheck.apps_status_constraint_unchanged = report.preCheck.apps_status_constraint_before === appsDefAfter;
  report.postCheck.apps_status_allows_payment_processing = Boolean(appsDefAfter && appsDefAfter.includes('payment_processing'));

  const rowCountsAfter = {};
  for (const t of CORE_TABLES) {
    const { rows } = await client.query(`select count(*)::bigint as n from public.${t}`);
    rowCountsAfter[t] = rows[0]?.n ?? null;
  }
  report.postCheck.rowCountsAfter = rowCountsAfter;
  report.postCheck.rowCountsUnchanged = JSON.stringify(rowCountsBefore) === JSON.stringify(rowCountsAfter);

  report.pass =
    report.apply.ok === true &&
    missing.length === 0 &&
    report.postCheck.trust_guard_trigger_present === true &&
    report.postCheck.apps_status_unchanged !== false &&
    report.postCheck.rowCountsUnchanged === true;
} catch (e) {
  report.error = redact(e instanceof Error ? e.message : String(e), dbUrl);
  if (report.apply.ok === undefined) report.apply = { ok: false };
} finally {
  if (client) { try { await client.end(); } catch { /* ignore */ } }
}

const outPath = path.join(logDir, `${stamp}-yyaz-legal-consent.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
