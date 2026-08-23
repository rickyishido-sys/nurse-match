#!/usr/bin/env node
/**
 * Seed App Store Review–only community co-participants on Production.
 *
 * Apple Guideline 2.1(a): reviewers need Community peers to exercise Report/Block.
 * Community (/connections) lists past confirmed co-participants only.
 *
 * Creates a dedicated past Community Review event plus 2 synthetic demo members.
 * Does NOT touch the legacy review event used for event-detail / participation QA.
 *
 * Required env (from .env.local / .env.secrets.local — never printed):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   HANAKAI_REVIEW_EMAIL  (existing participant review account)
 *
 * Optional:
 *   HANAKAI_REVIEW_COMMUNITY_EVENT_ID  (set automatically after first --apply)
 *
 * Usage:
 *   node scripts/seed-hanakai-review-community.mjs --dry-run
 *   node scripts/seed-hanakai-review-community.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SECRETS_FILE = resolve(ROOT, '.env.secrets.local');

/** Legacy review event for event-detail / participation QA — never modified by this script. */
const LEGACY_REVIEW_EVENT_ID = 'a27f5be8-a875-461c-9fd1-adfb936410ff';

const COMMUNITY_REVIEW_EVENT_TITLE = 'HANAKAI Community Review Demo';
const COMMUNITY_REVIEW_EVENT_DESCRIPTION =
  'App Store Review専用。Community（通報・ブロック）確認用の過去イベント。一般公開対象外。';

const DEMO_USERS = [
  {
    email: 'appstore-review-demo-a@hanakai.kranz.design',
    nickname: '審査デモA',
    gender: 'female',
    area: '東京都',
    age: 32,
    age_band: '30s',
    bio: 'App Store審査用のデモ参加者です。通報・ブロックの確認にご利用ください。',
    secretKey: 'HANAKAI_REVIEW_DEMO_A_PASSWORD',
  },
  {
    email: 'appstore-review-demo-b@hanakai.kranz.design',
    nickname: '審査デモB',
    gender: 'male',
    area: '神奈川県',
    age: 28,
    age_band: '20s',
    bio: 'App Store審査用のデモ参加者です。通報・ブロックの確認にご利用ください。',
    secretKey: 'HANAKAI_REVIEW_DEMO_B_PASSWORD',
  },
];

const PLANNED_OPS = {
  tables: [],
  creates: [],
  updates: [],
  untouched: [LEGACY_REVIEW_EVENT_ID],
};

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function upsertEnvFile(path, updates) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const keys = new Set(Object.keys(updates));
  const next = lines.map((line) => {
    const i = line.indexOf('=');
    if (i <= 0) return line;
    const key = line.slice(0, i).trim();
    if (!keys.has(key)) return line;
    keys.delete(key);
    return `${key}=${updates[key]}`;
  });
  for (const key of keys) next.push(`${key}=${updates[key]}`);
  writeFileSync(path, `${next.filter((l, idx) => l.length > 0 || idx < next.length - 1).join('\n').replace(/\n*$/, '\n')}`);
}

function maskEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return '(invalid)';
  return `${u.slice(0, 2)}***@${d}`;
}

function assertNotLegacyEventId(eventId, label = 'event id') {
  if (eventId === LEGACY_REVIEW_EVENT_ID) {
    throw new Error(`${label} must not be the legacy review event (${LEGACY_REVIEW_EVENT_ID})`);
  }
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const apply = argv.includes('--apply');
  if (dryRun === apply) {
    console.error('Specify exactly one of --dry-run or --apply');
    process.exit(1);
  }
  return { dryRun, apply };
}

async function findAuthUserByEmail(admin, email) {
  const target = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data?.users ?? []).find((u) => (u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (!data?.users?.length || data.users.length < 200) return null;
    page += 1;
    if (page > 50) return null;
  }
}

async function ensureAuthUser(admin, email, password, { apply }) {
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    console.log(`[seed] auth user exists ${maskEmail(email)} id=${existing.id}`);
    PLANNED_OPS.updates.push({ table: 'auth.users', key: maskEmail(email), action: 'update password + email_confirm' });
    if (apply) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) throw error;
    }
    return existing.id;
  }
  console.log(`[seed] create auth user ${maskEmail(email)}`);
  PLANNED_OPS.creates.push({ table: 'auth.users', key: maskEmail(email) });
  if (!apply) return `dry-run-auth-${email}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function ensureMember(admin, authUserId, profile, { apply }) {
  const { data: existing } = await admin
    .from('hanakai_members')
    .select('id, nickname, identity_verified, status, deleted_at')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existing?.id) {
    console.log(`[seed] member exists nickname=${existing.nickname} id=${existing.id}`);
    PLANNED_OPS.updates.push({ table: 'hanakai_members', key: profile.nickname, action: 'sync review demo profile' });
    if (apply) {
      const { error } = await admin
        .from('hanakai_members')
        .update({
          nickname: profile.nickname,
          gender: profile.gender,
          area: profile.area,
          age: profile.age,
          age_band: profile.age_band,
          bio: profile.bio,
          identity_verified: true,
          trust_verification_status: 'verified',
          document_upload_status: 'approved',
          identity_verification_method: 'manual_document',
          verification_source: 'id_only',
          status: 'active',
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) throw error;
    }
    return existing.id;
  }

  console.log(`[seed] create member ${profile.nickname}`);
  PLANNED_OPS.creates.push({ table: 'hanakai_members', key: profile.nickname });
  if (!apply) return `dry-run-member-${profile.nickname}`;
  const { data, error } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: authUserId,
      nickname: profile.nickname,
      gender: profile.gender,
      area: profile.area,
      age: profile.age,
      age_band: profile.age_band,
      bio: profile.bio,
      identity_verified: true,
      trust_verification_status: 'verified',
      document_upload_status: 'approved',
      identity_verification_method: 'manual_document',
      verification_source: 'id_only',
      status: 'active',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureConfirmedApplication(admin, eventId, memberId, memberLabel, { apply }) {
  assertNotLegacyEventId(eventId, 'application event_id');

  const { data: existing } = await admin
    .from('hanakai_event_applications')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status !== 'confirmed') {
      console.log(`[seed] upgrade application ${existing.id} -> confirmed (${memberLabel})`);
      PLANNED_OPS.updates.push({
        table: 'hanakai_event_applications',
        key: `${memberLabel}@${eventId}`,
        action: 'status -> confirmed (no payment rows)',
      });
      if (apply) {
        const { error } = await admin
          .from('hanakai_event_applications')
          .update({ status: 'confirmed', decided_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      }
    } else {
      console.log(`[seed] application already confirmed member=${memberLabel}`);
    }
    return existing.id;
  }

  console.log(`[seed] insert confirmed application member=${memberLabel}`);
  PLANNED_OPS.creates.push({
    table: 'hanakai_event_applications',
    key: `${memberLabel}@${eventId}`,
    action: 'confirmed, no payment_method_id',
  });
  if (!apply) return `dry-run-app-${memberId}`;
  const { data, error } = await admin
    .from('hanakai_event_applications')
    .insert({
      event_id: eventId,
      member_id: memberId,
      status: 'confirmed',
      reason: 'App Store review community demo participation',
      decided_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function findCommunityReviewEvent(admin, communityEventIdHint) {
  if (communityEventIdHint) {
    assertNotLegacyEventId(communityEventIdHint, 'HANAKAI_REVIEW_COMMUNITY_EVENT_ID');
    const { data, error } = await admin
      .from('hanakai_events')
      .select('id, title, start_at, is_past, status')
      .eq('id', communityEventIdHint)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    console.log(`[seed] HANAKAI_REVIEW_COMMUNITY_EVENT_ID not found; falling back to title lookup`);
  }

  const { data, error } = await admin
    .from('hanakai_events')
    .select('id, title, start_at, is_past, status')
    .eq('title', COMMUNITY_REVIEW_EVENT_TITLE)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureCommunityReviewEvent(admin, communityEventIdHint, { apply }) {
  const pastStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const existing = await findCommunityReviewEvent(admin, communityEventIdHint);

  if (existing?.id) {
    assertNotLegacyEventId(existing.id, 'resolved community event id');
    console.log(
      `[seed] community event exists id=${existing.id} title=${existing.title} is_past=${existing.is_past} start_at=${existing.start_at}`,
    );

    const needsPast = !existing.is_past || new Date(existing.start_at).getTime() > Date.now();
    if (needsPast) {
      PLANNED_OPS.updates.push({
        table: 'hanakai_events',
        key: existing.id,
        action: 'ensure past + closed on community review event only',
      });
      console.log(`[seed] community event needsPast=${needsPast}`);
      if (apply) {
        const { error: updErr } = await admin
          .from('hanakai_events')
          .update({
            start_at: pastStart,
            is_past: true,
            status: 'closed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updErr) throw updErr;
        console.log('[seed] ensured community review event is past/closed');
      }
    }
    return existing.id;
  }

  console.log(`[seed] create community review event title=${COMMUNITY_REVIEW_EVENT_TITLE}`);
  PLANNED_OPS.creates.push({
    table: 'hanakai_events',
    key: COMMUNITY_REVIEW_EVENT_TITLE,
    action: 'past closed review-only event, fee=0, no host member',
  });
  if (!apply) return 'dry-run-community-event-id';

  const { data, error } = await admin
    .from('hanakai_events')
    .insert({
      title: COMMUNITY_REVIEW_EVENT_TITLE,
      category: 'other',
      start_at: pastStart,
      area: '東京都',
      venue: '（審査用・非公開）',
      capacity: 6,
      host_member_id: null,
      host_name: 'HANAKAI 運営',
      conditions: 'App Store Review専用',
      description: COMMUNITY_REVIEW_EVENT_DESCRIPTION,
      cover_url: '',
      status: 'closed',
      fee: 0,
      approval_mode: 'auto',
      is_user_created: false,
      is_past: true,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const { dryRun, apply } = parseArgs(process.argv.slice(2));
  const fileEnv = {
    ...loadEnvFile(resolve(ROOT, '.env.local')),
    ...loadEnvFile(resolve(ROOT, '.env.production.local')),
    ...loadEnvFile(SECRETS_FILE),
    ...process.env,
  };

  const url = (fileEnv.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';
  const reviewEmail = (fileEnv.HANAKAI_REVIEW_EMAIL || '').trim().toLowerCase();
  const communityEventIdHint = (fileEnv.HANAKAI_REVIEW_COMMUNITY_EVENT_ID || '').trim();

  if (communityEventIdHint) {
    assertNotLegacyEventId(communityEventIdHint, 'HANAKAI_REVIEW_COMMUNITY_EVENT_ID');
  }

  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!reviewEmail) {
    console.error('Missing HANAKAI_REVIEW_EMAIL in .env.secrets.local');
    process.exit(1);
  }

  console.log(`[seed] mode=${apply ? 'APPLY' : 'DRY-RUN'} review=${maskEmail(reviewEmail)}`);
  console.log(`[seed] legacy review event ${LEGACY_REVIEW_EVENT_ID} is untouched (out of scope)`);

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const reviewAuth = await findAuthUserByEmail(admin, reviewEmail);
  if (!reviewAuth) {
    console.error('Review participant auth user not found');
    process.exit(1);
  }
  const { data: reviewMember, error: reviewMemberErr } = await admin
    .from('hanakai_members')
    .select('id, nickname, identity_verified')
    .eq('auth_user_id', reviewAuth.id)
    .maybeSingle();
  if (reviewMemberErr) throw reviewMemberErr;
  if (!reviewMember?.id) {
    console.error('Review participant hanakai_members row not found');
    process.exit(1);
  }
  console.log(`[seed] review member id=${reviewMember.id} nickname=${reviewMember.nickname}`);

  const eventId = await ensureCommunityReviewEvent(admin, communityEventIdHint, { apply });
  assertNotLegacyEventId(eventId, 'community event id');
  console.log(`[seed] community event id=${eventId}`);

  await ensureConfirmedApplication(admin, eventId, reviewMember.id, 'review-participant', { apply });

  const secretUpdates = {};
  const demoMemberIds = [];

  for (const demo of DEMO_USERS) {
    const password =
      fileEnv[demo.secretKey] && String(fileEnv[demo.secretKey]).length >= 12
        ? String(fileEnv[demo.secretKey])
        : `HkRev${randomBytes(12).toString('base64url')}!`;
    secretUpdates[demo.secretKey] = password;

    const authId = await ensureAuthUser(admin, demo.email, password, { apply });
    const memberId = await ensureMember(admin, authId, demo, { apply });
    demoMemberIds.push(memberId);
    await ensureConfirmedApplication(admin, eventId, memberId, demo.nickname, { apply });
  }

  PLANNED_OPS.tables = [
    'auth.users (demo A/B only)',
    'hanakai_members (demo A/B only)',
    'hanakai_events (community review event only)',
    'hanakai_event_applications (community review event × review participant + demo A/B)',
  ];

  if (apply) {
    upsertEnvFile(SECRETS_FILE, {
      HANAKAI_REVIEW_DEMO_A_EMAIL: DEMO_USERS[0].email,
      HANAKAI_REVIEW_DEMO_B_EMAIL: DEMO_USERS[1].email,
      ...secretUpdates,
      HANAKAI_REVIEW_COMMUNITY_EVENT_ID: eventId,
    });
    console.log(`[seed] wrote demo emails (not passwords in logs) to ${SECRETS_FILE}`);
  }

  console.log('[seed] done');
  console.log(
    JSON.stringify(
      {
        legacyReviewEventUntouched: LEGACY_REVIEW_EVENT_ID,
        reviewMemberId: reviewMember.id,
        communityEventId: eventId,
        communityEventTitle: COMMUNITY_REVIEW_EVENT_TITLE,
        demoMemberIds,
        communityPath: `/connections/${eventId}`,
        plannedOperations: PLANNED_OPS,
        verify: [
          'Login as review participant (appstore-review@hanakai.kranz.design)',
          'Open Community tab (/connections)',
          'Open "HANAKAI Community Review Demo" past event card',
          'See 審査デモA / 審査デモB',
          'Report from /connections/{eventId} or /profile/{memberId}',
          'Block from /profile/{memberId}',
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('[seed] FAILED', err?.message || err);
  process.exit(1);
});
