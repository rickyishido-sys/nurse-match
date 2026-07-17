#!/usr/bin/env node
/**
 * Verify 20260718_hanakai_legal_consent_rls migration on linked Supabase project.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
mkdirSync(logDir, { recursive: true });

function dbQuery(sql) {
  const out = execSync(`npx supabase db query --linked ${JSON.stringify(sql)}`, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const jsonStart = out.indexOf('[') >= 0 ? out.indexOf('[') : out.indexOf('{');
  if (jsonStart < 0) throw new Error('No JSON in db query output');
  return JSON.parse(out.slice(jsonStart));
}

const checks = {};

try {
  checks.columns = dbQuery(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hanakai_members'
      and column_name in ('terms_agreed_at','privacy_agreed_at','terms_version','privacy_version')
    order by column_name;
  `);

  checks.trigger = dbQuery(`
    select tgname, tgenabled
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'hanakai_members'
      and tgname = 'hanakai_members_guard_trust'
      and not t.tgisinternal;
  `);

  checks.function = dbQuery(`
    select proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and proname = 'hanakai_guard_member_trust_columns';
  `);

  checks.deletion_fk = dbQuery(`
    select conname
    from pg_constraint
    where conrelid = 'public.hanakai_account_deletion_requests'::regclass
      and conname = 'hanakai_account_deletion_requests_auth_user_id_fkey';
  `);

  checks.auth_user_id_nullable = dbQuery(`
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hanakai_account_deletion_requests'
      and column_name = 'auth_user_id';
  `);

  checks.existing_members = dbQuery(`
    select
      count(*)::int as total,
      count(*) filter (where terms_agreed_at is not null)::int as with_terms,
      count(*) filter (where privacy_agreed_at is not null)::int as with_privacy
    from public.hanakai_members
    where status = 'active';
  `);

  const colNames = (checks.columns ?? []).map((r) => r.column_name);
  const pass =
    colNames.length === 4 &&
    (checks.trigger ?? []).length === 1 &&
    (checks.function ?? []).length === 1 &&
    (checks.deletion_fk ?? []).length === 0 &&
    checks.auth_user_id_nullable?.[0]?.is_nullable === 'YES';

  const report = { stamp, pass, checks };
  const outPath = path.join(logDir, `${stamp}-legal-consent-verify.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, logPath: outPath }, null, 2));
  process.exit(pass ? 0 : 1);
} catch (e) {
  const err = { stamp, pass: false, error: String(e.message ?? e) };
  const outPath = path.join(logDir, `${stamp}-legal-consent-verify-error.json`);
  writeFileSync(outPath, JSON.stringify(err, null, 2));
  console.log(JSON.stringify({ ...err, logPath: outPath }, null, 2));
  process.exit(1);
}
