#!/usr/bin/env node
/**
 * READ-ONLY production (xuex) pre-check for the HANAKAI Square payments rollout.
 * - Loads ONLY .env.production.local (refuses if the URL is not xuex).
 * - Uses PostgREST OpenAPI (tables/columns/RPCs) + HEAD counts + a capped
 *   distinct-status scan. Performs NO writes and NO DDL.
 * - Triggers / CHECK-constraint bodies / function bodies are NOT visible via
 *   PostgREST and are reported as "needs_sql" (read-only SQL is in the plan).
 *
 * Usage: node scripts/precheck-xuex-production.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(outDir, { recursive: true });

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

// URL comes from the committed-local prod file (xuex). The service-role value is
// read from .env.secrets.local (xuex prod key). The JWT-ref guard below aborts
// if it is not the xuex project ref. READ-ONLY: no writes, no env pull.
const prodLocal = loadEnvFile(path.join(root, '.env.production.local'));
const secrets = loadEnvFile(path.join(root, '.env.secrets.local'));
const url = (prodLocal.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = secrets.SUPABASE_SERVICE_ROLE_KEY || prodLocal.SUPABASE_SERVICE_ROLE_KEY || '';

function jwtRef(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));
    return payload.ref || null;
  } catch {
    return null;
  }
}

const EVENT_COLS_20260716 = [
  'external_recruitment', 'venue_permission_confirmed', 'venue_fee_explained', 'billing_target',
  'venue_billing_name', 'venue_billing_contact', 'venue_billing_phone', 'venue_billing_email',
  'venue_billing_address', 'venue_billing_consent', 'checkin_code_hash', 'ended_at',
  'revenue_report_requested_at', 'revenue_report_reminder_12h_at', 'revenue_report_reminder_24h_at',
];
const TABLES_20260716 = [
  'hanakai_event_checkins', 'hanakai_event_checkin_attempts', 'hanakai_event_revenue_reports',
  'hanakai_event_revenue_documents', 'hanakai_event_invoices', 'hanakai_event_operation_notifications',
];
const MEMBER_COLS_20260718 = ['terms_agreed_at', 'privacy_agreed_at', 'terms_version', 'privacy_version'];
const TABLES_20260802 = [
  'hanakai_square_customers', 'hanakai_payment_methods', 'hanakai_payment_consents',
  'hanakai_participation_payments', 'hanakai_square_webhook_events',
];
const EVENT_COLS_20260802 = [
  'application_deadline', 'participant_selection_deadline', 'additional_recruitment_enabled',
  'additional_recruitment_deadline', 'final_payment_deadline', 'event_fee_type', 'event_fee_amount',
  'event_fee_min', 'event_fee_max', 'event_fee_payment_recipient', 'event_fee_payment_method',
  'event_fee_includes', 'event_fee_excludes', 'event_fee_notes', 'minimum_participants',
  'last_participant_selection_at',
];
const APP_COLS_20260802 = ['payment_deadline_at', 'selected_at', 'not_selected_at'];
const TARGET_APP_STATUS_SET = [
  'pending', 'payment_processing', 'payment_failed', 'confirmed', 'payment_expired',
  'not_selected', 'cancelled', 'refunded', 'awaiting_confirmation', 'rejected',
];

async function headCount(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id`, {
    method: 'HEAD',
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
  });
  const cr = res.headers.get('content-range'); // e.g. 0-0/1234
  const total = cr && cr.includes('/') ? cr.split('/')[1] : null;
  return { status: res.status, count: total === '*' ? null : total ? Number(total) : (res.ok ? 0 : null) };
}

async function distinctAppStatuses(cap = 20000) {
  const res = await fetch(`${url}/rest/v1/hanakai_event_applications?select=status&limit=${cap}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return { ok: false, status: res.status };
  const rows = await res.json().catch(() => []);
  const set = [...new Set(rows.map((r) => r.status))];
  return { ok: true, distinct: set, sampled: rows.length, capped: rows.length >= cap };
}

const report = {
  target: 'xuex (production) — READ ONLY',
  supabaseRefOk: url.includes('xuex'),
  migrations: {}, counts: {}, appStatus: {}, notes: [],
};

try {
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing in .env.production.local');
  if (!url.includes('xuex')) throw new Error(`Refusing: production URL is not xuex (got ref hidden)`);
  if (url.includes('yyaz')) throw new Error('Refusing: URL is yyaz, expected xuex');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not available (pull production env to .env.prod.pull)');
  const ref = jwtRef(key);
  report.serviceRoleRef = ref;
  if (ref && !ref.includes('xuex')) throw new Error(`Refusing: service-role JWT ref (${ref}) is not xuex`);

  const oapi = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const doc = await oapi.json();
  const defs = doc.definitions || {};
  const cols = (t) => (defs[t] ? Object.keys(defs[t].properties || {}) : null);
  const rpcPaths = Object.keys(doc.paths || {}).filter((p) => p.startsWith('/rpc/'));
  const hasRpc = (name) => rpcPaths.includes(`/rpc/${name}`);
  const tablePresent = (t) => Boolean(defs[t]);
  const colReport = (table, list) => {
    const present = cols(table);
    if (!present) return { table_present: false, missing: list };
    return { table_present: true, missing: list.filter((c) => !present.includes(c)) };
  };

  report.migrations['20260716_event_operations'] = {
    hanakai_events_missing_cols: colReport('hanakai_events', EVENT_COLS_20260716).missing,
    tables: Object.fromEntries(TABLES_20260716.map((t) => [t, tablePresent(t)])),
  };
  report.migrations['20260718_legal_consent'] = {
    hanakai_members_missing_cols: colReport('hanakai_members', MEMBER_COLS_20260718).missing,
    hanakai_account_deletion_requests_present: tablePresent('hanakai_account_deletion_requests'),
    trust_guard_trigger: 'needs_sql',
  };
  report.migrations['20260802_square_payments'] = {
    tables: Object.fromEntries(TABLES_20260802.map((t) => [t, tablePresent(t)])),
    hanakai_events_missing_cols: colReport('hanakai_events', EVENT_COLS_20260802).missing,
    hanakai_event_applications_missing_cols: colReport('hanakai_event_applications', APP_COLS_20260802).missing,
    rpc_select_participants: hasRpc('hanakai_select_participants_for_payment'),
    apps_status_check_constraint: 'needs_sql',
    rpc_hardcodes_sandbox_environment: 'CONFIRMED in migration source (line ~319) — production charge blocker',
  };
  report.migrations['20260802_fix_expiry_rpc'] = {
    rpc_expire_overdue: hasRpc('hanakai_expire_overdue_participation_payments'),
    rpc_body_correct: 'needs_sql',
  };

  for (const t of ['hanakai_members', 'hanakai_events', 'hanakai_event_applications', ...TABLES_20260802]) {
    if (tablePresent(t)) report.counts[t] = (await headCount(t)).count;
    else report.counts[t] = 'TABLE_ABSENT';
  }

  const st = await distinctAppStatuses();
  report.appStatus = st.ok
    ? {
        distinct_values: st.distinct,
        sampled_rows: st.sampled,
        capped: st.capped,
        values_outside_target_constraint: st.distinct.filter((s) => !TARGET_APP_STATUS_SET.includes(s)),
      }
    : { error_status: st.status };

  report.notes.push('OpenAPI cannot see triggers / CHECK bodies / function bodies — verify via read-only SQL in plan.');
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
}

const outPath = path.join(outDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-xuex-precheck.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, reportPath: outPath }, null, 2));
