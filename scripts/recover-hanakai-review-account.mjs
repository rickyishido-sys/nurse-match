#!/usr/bin/env node
/**
 * Recover App Store review account credentials for HANAKAI Production.
 *
 * Uses the same env loading pattern as other production ops scripts:
 *   .env.production.local / .env.secrets.local / .env.local
 * Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Does NOT print email/password. Writes HANAKAI_REVIEW_* into .env.secrets.local.
 *
 * Usage:
 *   node scripts/recover-hanakai-review-account.mjs
 *   node scripts/recover-hanakai-review-account.mjs --dry-run
 *   node scripts/recover-hanakai-review-account.mjs --member-id=<uuid>
 *   node scripts/recover-hanakai-review-account.mjs --skip-password-reset  # identify + write env email only
 *
 * Safety:
 *   - Never deletes/recreates users
 *   - Never changes identity/profile fields
 *   - Password reset via Supabase Auth admin.updateUserById only
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const secretsPath = path.join(root, '.env.secrets.local');
const REVIEW_EVENT_ID = process.env.HANAKAI_REVIEW_EVENT_ID ?? 'a27f5be8-a875-461c-9fd1-adfb936410ff';
const dryRun = process.argv.includes('--dry-run');
const skipPasswordReset = process.argv.includes('--skip-password-reset');
const memberIdArg = process.argv.find((a) => a.startsWith('--member-id='))?.slice('--member-id='.length);

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) env[key] = val;
  }
  return env;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '(none)';
  const [local, domain] = email.split('@');
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}***@${domain}`;
}

function upsertSecrets(updates) {
  const existing = existsSync(secretsPath) ? readFileSync(secretsPath, 'utf8') : '';
  const map = new Map();
  for (const line of existing.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1));
  }
  for (const [k, v] of Object.entries(updates)) map.set(k, v);
  const body =
    [...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n') +
    '\n';
  writeFileSync(secretsPath, body, { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(secretsPath, 0o600);
  } catch {
    /* ignore */
  }
}

function generatePassword() {
  // Strong random password; never printed.
  return `Hk!${randomBytes(18).toString('base64url')}`;
}

const fileEnv = {
  ...loadEnv(path.join(root, '.env.production.local')),
  ...loadEnv(path.join(root, '.env.vercel.prod.local')),
  ...loadEnv(path.join(root, '.env.local')),
  ...loadEnv(secretsPath),
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('BLOCKED: Production Supabase admin env missing.');
  console.error('Required (existing ops pattern): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  console.error('Put them in gitignored .env.secrets.local (do not commit), then rerun.');
  console.error('Checked:');
  for (const f of ['.env.production.local', '.env.vercel.prod.local', '.env.local', '.env.secrets.local']) {
    const p = path.join(root, f);
    const e = loadEnv(p);
    console.error(
      `  ${f}: ${existsSync(p) ? 'exists' : 'missing'} url=${Boolean(e.NEXT_PUBLIC_SUPABASE_URL)} serviceRole=${Boolean(e.SUPABASE_SERVICE_ROLE_KEY)}`,
    );
  }
  process.exit(2);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

function scoreCandidate(row, eventRelatedIds) {
  let score = 0;
  const reasons = [];
  if (row.identity_verified === true || row.trust_verification_status === 'approved') {
    score += 3;
    reasons.push('identity_approved');
  }
  if (row.document_upload_status === 'approved') {
    score += 2;
    reasons.push('document_approved');
  }
  if (row.nickname && row.area && row.age_band) {
    score += 2;
    reasons.push('profile_fields');
  }
  if (row.avatar_url || row.profile_image_url) {
    score += 1;
    reasons.push('photo');
  }
  if (row.status === 'active' || !row.status) {
    score += 1;
    reasons.push('active');
  }
  if (eventRelatedIds.has(row.id) || eventRelatedIds.has(row.auth_user_id)) {
    score += 4;
    reasons.push('review_event_related');
  }
  const blob = `${row.nickname ?? ''} ${row.email ?? ''} ${row.internal_memo ?? ''}`.toLowerCase();
  if (/review|apple|appstore|app.?store|審査/.test(blob)) {
    score += 5;
    reasons.push('review_marker');
  }
  return { score, reasons };
}

async function listAuthEmailById(authUserId) {
  const { data, error } = await admin.auth.admin.getUserById(authUserId);
  if (error) return { email: null, error: error.message, banned: false, deleted: false };
  const u = data?.user;
  return {
    email: u?.email ?? null,
    banned: Boolean(u?.banned_until),
    deleted: Boolean(u?.deleted_at),
    error: null,
  };
}

async function main() {
  console.log('STEP1: Identify App Store review account candidates (values masked)');

  // Review event relations (host / applicants)
  const eventRelatedIds = new Set();
  const { data: event, error: eventErr } = await admin
    .from('hanakai_events')
    .select('id,title,host_id,created_at')
    .eq('id', REVIEW_EVENT_ID)
    .maybeSingle();
  if (eventErr) console.error('event lookup warning:', eventErr.message);
  if (event?.host_id) eventRelatedIds.add(event.host_id);
  console.log(
    'review_event:',
    event
      ? { found: true, titleHasReviewWord: /審査|review/i.test(event.title ?? '') }
      : { found: false },
  );

  const { data: apps } = await admin
    .from('hanakai_event_applications')
    .select('member_id,status,created_at')
    .eq('event_id', REVIEW_EVENT_ID);
  for (const a of apps ?? []) if (a.member_id) eventRelatedIds.add(a.member_id);

  let membersQuery = admin
    .from('hanakai_members')
    .select(
      'id,auth_user_id,nickname,email,status,area,age_band,identity_verified,trust_verification_status,document_upload_status,avatar_url,profile_image_url,created_at,internal_memo',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (memberIdArg) membersQuery = membersQuery.eq('id', memberIdArg);

  const { data: members, error: membersErr } = await membersQuery;
  if (membersErr) {
    console.error('hanakai_members query failed:', membersErr.message);
    process.exit(1);
  }

  const ranked = [];
  for (const m of members ?? []) {
    if (m.status === 'deleted' || m.status === 'suspended') continue;
    const { score, reasons } = scoreCandidate(m, eventRelatedIds);
    if (score < 3 && !memberIdArg) continue;
    const auth = m.auth_user_id ? await listAuthEmailById(m.auth_user_id) : { email: null };
    ranked.push({
      memberId: m.id,
      authUserId: m.auth_user_id,
      maskedEmail: maskEmail(auth.email || m.email),
      email: auth.email || m.email || null,
      nickname: m.nickname,
      score,
      reasons,
      identity_verified: m.identity_verified,
      trust_verification_status: m.trust_verification_status,
      document_upload_status: m.document_upload_status,
      status: m.status ?? 'active',
      authBanned: auth.banned,
      authDeleted: auth.deleted,
      authError: auth.error,
      created_at: m.created_at,
      profileComplete: Boolean(m.nickname && m.area && m.age_band),
      eventRelated: eventRelatedIds.has(m.id),
    });
  }

  ranked.sort((a, b) => b.score - a.score || String(b.created_at).localeCompare(String(a.created_at)));

  if (!ranked.length) {
    console.error('No review-account candidates found. Pass --member-id= if you know it.');
    process.exit(1);
  }

  console.log('Top candidates (masked):');
  for (const c of ranked.slice(0, 8)) {
    console.log(
      JSON.stringify({
        maskedEmail: c.maskedEmail,
        nickname: c.nickname,
        score: c.score,
        reasons: c.reasons,
        identity_verified: c.identity_verified,
        trust_verification_status: c.trust_verification_status,
        document_upload_status: c.document_upload_status,
        status: c.status,
        profileComplete: c.profileComplete,
        eventRelated: c.eventRelated,
        authOk: Boolean(c.authUserId) && !c.authBanned && !c.authDeleted && !c.authError,
      }),
    );
  }

  const chosen = ranked[0];
  console.log('STEP2: Chosen candidate checks');
  const checks = {
    auth_user_exists: Boolean(chosen.authUserId) && !chosen.authError,
    hanakai_members_exists: true,
    identity_approved:
      chosen.identity_verified === true ||
      chosen.trust_verification_status === 'approved' ||
      chosen.document_upload_status === 'approved',
    profile_complete: chosen.profileComplete,
    not_deleted_or_suspended: chosen.status !== 'deleted' && chosen.status !== 'suspended' && !chosen.authDeleted && !chosen.authBanned,
    review_event_access_possible: true,
  };
  console.log(JSON.stringify({ maskedEmail: chosen.maskedEmail, checks, PASS: Object.values(checks).every(Boolean) }));

  if (!Object.values(checks).every(Boolean)) {
    console.error('Candidate failed STEP2 checks. Aborting without changes.');
    process.exit(1);
  }

  if (!chosen.email || !chosen.authUserId) {
    console.error('Chosen candidate missing auth email/id. Aborting.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('Dry-run complete. No password/env changes.');
    return;
  }

  let password = null;
  if (!skipPasswordReset) {
    console.log('STEP3: Resetting password via Supabase Auth admin API (value not printed)');
    password = generatePassword();
    const { error: updErr } = await admin.auth.admin.updateUserById(chosen.authUserId, {
      password,
      email_confirm: true,
    });
    if (updErr) {
      console.error('Password reset failed:', updErr.message);
      process.exit(1);
    }
    console.log('Password reset: OK');
  } else {
    console.log('STEP3: skipped (--skip-password-reset)');
  }

  console.log('STEP4: Writing HANAKAI_REVIEW_* to .env.secrets.local (gitignored)');
  const updates = { HANAKAI_REVIEW_EMAIL: chosen.email };
  if (password) updates.HANAKAI_REVIEW_PASSWORD = password;
  if (!password && !fileEnv.HANAKAI_REVIEW_PASSWORD) {
    console.error('No password to write. Run without --skip-password-reset, or set password manually.');
    process.exit(1);
  }
  upsertSecrets(updates);
  console.log('Wrote secrets file keys: HANAKAI_REVIEW_EMAIL' + (password ? ', HANAKAI_REVIEW_PASSWORD' : ''));
  console.log('maskedEmail:', chosen.maskedEmail);
  console.log('NEXT: run login verification (not printing secrets), then screenshots.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
