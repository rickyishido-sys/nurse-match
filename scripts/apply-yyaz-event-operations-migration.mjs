#!/usr/bin/env node
/**
 * Apply the ONLY missing HANAKAI migration required for the event-create API +
 * full Square payments E2E on Preview yyaz:
 *
 *   supabase/migrations/20260716_hanakai_event_operations.sql
 *
 * This adds hanakai_events operations columns (incl. billing_target) and creates
 * hanakai_event_operation_notifications / hanakai_event_checkins / revenue / invoice
 * tables. It does NOT touch the hanakai_event_applications status constraint, so the
 * broad payment statuses set by 20260802_hanakai_square_payments.sql are preserved.
 *
 * Safety:
 *  - yyaz-only (refuses xuex / any non-yyaz fingerprint)
 *  - DATABASE_URL is read from process.env ONLY (never args, never logged)
 *  - single BEGIN/COMMIT, ROLLBACK on error
 *  - pre-check + post-check (incl. regression guard on apps status constraint)
 *
 * Usage (run on your Mac terminal):
 *   DATABASE_URL='postgresql://postgres.<yyaz-ref>:<password>@<host>:5432/postgres' \
 *     node scripts/apply-yyaz-event-operations-migration.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(logDir, { recursive: true });

const MIGRATION = 'supabase/migrations/20260716_hanakai_event_operations.sql';
const NEW_TABLES = [
  'hanakai_event_checkins',
  'hanakai_event_checkin_attempts',
  'hanakai_event_revenue_reports',
  'hanakai_event_revenue_documents',
  'hanakai_event_invoices',
  'hanakai_event_operation_notifications',
];
const NEW_EVENT_COLUMNS = [
  'external_recruitment', 'venue_permission_confirmed', 'venue_fee_explained', 'billing_target',
  'venue_billing_name', 'venue_billing_contact', 'venue_billing_phone', 'venue_billing_email',
  'venue_billing_address', 'venue_billing_consent', 'checkin_code_hash', 'ended_at',
  'revenue_report_requested_at', 'revenue_report_reminder_12h_at', 'revenue_report_reminder_24h_at',
];
const CORE_TABLES = ['hanakai_members', 'hanakai_events', 'hanakai_event_applications'];

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
async function tableExists(client, table) {
  const { rows } = await client.query(
    `select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name=$1) as ok`,
    [table],
  );
  return rows[0]?.ok === true;
}
async function appsStatusConstraintDef(client) {
  const { rows } = await client.query(
    `select pg_get_constraintdef(c.oid) as def
     from pg_constraint c
     where c.conrelid = 'public.hanakai_event_applications'::regclass
       and c.conname = 'hanakai_event_applications_status_check'
     limit 1`,
  );
  return rows[0]?.def ?? null;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = {
  stamp,
  targetRef: 'yyaz',
  migration: MIGRATION,
  gitSha: execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim(),
  connection: {},
  preCheck: {},
  apply: { ok: false },
  postCheck: {},
  pass: false,
};

let dbUrl = '';
let client;
try {
  dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? '';
  assertYyaz(dbUrl);
  report.connection = { fingerprint: refFingerprint(dbUrl) };

  const abs = path.join(root, MIGRATION);
  if (!existsSync(abs)) throw new Error(`Missing ${MIGRATION}`);
  const sql = readFileSync(abs, 'utf8');

  client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // ---- Pre-check ----
  report.preCheck.billing_target_present_before = await columnExists(client, 'hanakai_events', 'billing_target');
  report.preCheck.operation_notifications_table_before = await tableExists(client, 'hanakai_event_operation_notifications');
  report.preCheck.apps_status_constraint_before = await appsStatusConstraintDef(client);
  const rowCountsBefore = {};
  for (const t of CORE_TABLES) {
    const { rows } = await client.query(`select count(*)::bigint as n from public.${t}`);
    rowCountsBefore[t] = rows[0]?.n ?? null;
  }
  report.preCheck.rowCountsBefore = rowCountsBefore;
  const { rows: rlsBefore } = await client.query(
    `select c.relname as t, c.relrowsecurity as rls from pg_class c
     join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relname = any($1::text[]) order by c.relname`,
    [CORE_TABLES],
  );
  report.preCheck.rlsCore = rlsBefore;

  // ---- Apply (single transaction) ----
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    report.apply = { ok: true, method: 'pg_client_transaction' };
  } catch (migErr) {
    await client.query('ROLLBACK');
    throw migErr;
  }

  // ---- Post-check ----
  const missingCols = [];
  for (const col of NEW_EVENT_COLUMNS) {
    if (!(await columnExists(client, 'hanakai_events', col))) missingCols.push(col);
  }
  report.postCheck.events_missing_columns_after = missingCols;

  const tablePresence = {};
  for (const t of NEW_TABLES) tablePresence[t] = await tableExists(client, t);
  report.postCheck.new_tables_present = tablePresence;

  const appsDefAfter = await appsStatusConstraintDef(client);
  report.postCheck.apps_status_constraint_after = appsDefAfter;
  report.postCheck.apps_status_constraint_unchanged =
    report.preCheck.apps_status_constraint_before === appsDefAfter;
  report.postCheck.apps_status_allows_payment_processing = Boolean(
    appsDefAfter && appsDefAfter.includes('payment_processing'),
  );

  const rowCountsAfter = {};
  for (const t of CORE_TABLES) {
    const { rows } = await client.query(`select count(*)::bigint as n from public.${t}`);
    rowCountsAfter[t] = rows[0]?.n ?? null;
  }
  report.postCheck.rowCountsAfter = rowCountsAfter;
  report.postCheck.rowCountsUnchanged = JSON.stringify(rowCountsBefore) === JSON.stringify(rowCountsAfter);

  const { rows: rlsAfter } = await client.query(
    `select c.relname as t, c.relrowsecurity as rls from pg_class c
     join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relname = any($1::text[]) order by c.relname`,
    [NEW_TABLES],
  );
  report.postCheck.rlsNewTables = rlsAfter;

  report.pass =
    report.apply.ok === true &&
    missingCols.length === 0 &&
    Object.values(tablePresence).every(Boolean) &&
    report.postCheck.apps_status_allows_payment_processing === true &&
    report.postCheck.rowCountsUnchanged === true;
} catch (e) {
  report.error = redact(e instanceof Error ? e.message : String(e), dbUrl);
  if (report.apply.ok === undefined) report.apply = { ok: false };
} finally {
  if (client) {
    try { await client.end(); } catch { /* ignore */ }
  }
}

const outPath = path.join(logDir, `${stamp}-yyaz-event-operations.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
process.exit(report.pass ? 0 : 1);
