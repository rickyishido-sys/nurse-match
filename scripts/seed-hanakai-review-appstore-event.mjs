#!/usr/bin/env node
/**
 * Seed App Store Review–only UPCOMING demo event on Production.
 *
 * Fixes Apple 2.1(a) "no events were found" by creating a future event visible on /events.
 * Does NOT modify legacy review event or Community Review Demo event.
 *
 * Required env (.env.secrets.local — never printed):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   HANAKAI_REVIEW_EMAIL          participant: appstore-review@hanakai.kranz.design
 *   HANAKAI_REVIEW_HOST_EMAIL     organizer: review-host@hanakai.kranz.design
 *
 * Optional:
 *   HANAKAI_REVIEW_APPSTORE_EVENT_ID  (set after first --apply)
 *
 * Usage:
 *   node scripts/seed-hanakai-review-appstore-event.mjs --dry-run
 *   node scripts/seed-hanakai-review-appstore-event.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SECRETS_FILE = resolve(ROOT, '.env.secrets.local');

const LEGACY_EVENT_ID = 'a27f5be8-a875-461c-9fd1-adfb936410ff';
const COMMUNITY_EVENT_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';

const EVENT_TITLE = 'HANAKAI App Review Demo Event';
const EVENT_DESCRIPTION =
  'App Store Review専用の体験イベントです。一般参加者アカウントで一覧・詳細・参加申請、主催者アカウントで申請管理をご確認ください。実課金は発生しません。';
const WEEKS_AHEAD = 4;

const PROTECTED_EVENT_IDS = new Set([LEGACY_EVENT_ID, COMMUNITY_EVENT_ID]);

const PLANNED_OPS = {
  tables: [],
  creates: [],
  updates: [],
  untouched: [...PROTECTED_EVENT_IDS],
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

function assertNotProtectedEventId(eventId, label = 'event id') {
  if (PROTECTED_EVENT_IDS.has(eventId)) {
    throw new Error(`${label} must not be a protected review event (${eventId})`);
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

async function ensureReviewMember(admin, authUserId, profile, { apply }) {
  const { data: existing } = await admin
    .from('hanakai_members')
    .select('id, nickname, identity_verified, status, deleted_at')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  const patch = {
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
  };

  if (existing?.id) {
    console.log(`[seed] member exists nickname=${existing.nickname} id=${existing.id}`);
    PLANNED_OPS.updates.push({ table: 'hanakai_members', key: profile.nickname, action: 'ensure review-ready profile' });
    if (apply) {
      const { error } = await admin.from('hanakai_members').update(patch).eq('id', existing.id);
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
      ...patch,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function findAppStoreReviewEvent(admin, eventIdHint) {
  if (eventIdHint) {
    assertNotProtectedEventId(eventIdHint, 'HANAKAI_REVIEW_APPSTORE_EVENT_ID');
    const { data, error } = await admin
      .from('hanakai_events')
      .select('id, title, start_at, is_past, status, host_member_id')
      .eq('id', eventIdHint)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    console.log('[seed] HANAKAI_REVIEW_APPSTORE_EVENT_ID not found; falling back to title lookup');
  }

  const { data, error } = await admin
    .from('hanakai_events')
    .select('id, title, start_at, is_past, status, host_member_id')
    .eq('title', EVENT_TITLE)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureAppStoreReviewEvent(admin, eventIdHint, hostMemberId, hostNickname, { apply }) {
  const startAt = new Date(Date.now() + WEEKS_AHEAD * 7 * 24 * 60 * 60 * 1000).toISOString();
  const existing = await findAppStoreReviewEvent(admin, eventIdHint);

  if (existing?.id) {
    assertNotProtectedEventId(existing.id, 'resolved appstore event id');
    console.log(
      `[seed] appstore event exists id=${existing.id} title=${existing.title} start_at=${existing.start_at} is_past=${existing.is_past}`,
    );
    const needsFuture =
      existing.is_past === true ||
      new Date(existing.start_at).getTime() <= Date.now() ||
      existing.status === 'closed' ||
      existing.status === 'completed' ||
      existing.status === 'cancelled' ||
      existing.host_member_id !== hostMemberId;

    if (needsFuture) {
      PLANNED_OPS.updates.push({
        table: 'hanakai_events',
        key: existing.id,
        action: 'ensure future/open/host for appstore review event only',
      });
      console.log(`[seed] appstore event needsFuture=${needsFuture}`);
      if (apply) {
        const { error } = await admin
          .from('hanakai_events')
          .update({
            title: EVENT_TITLE,
            start_at: startAt,
            is_past: false,
            status: 'open',
            host_member_id: hostMemberId,
            host_name: hostNickname,
            fee: 0,
            approval_mode: 'host_approval',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      }
    }
    return existing.id;
  }

  console.log(`[seed] create appstore review event title=${EVENT_TITLE}`);
  PLANNED_OPS.creates.push({
    table: 'hanakai_events',
    key: EVENT_TITLE,
    action: 'future open review event, fee=0, host=review-host',
  });
  if (!apply) return 'dry-run-appstore-event-id';

  const { data, error } = await admin
    .from('hanakai_events')
    .insert({
      title: EVENT_TITLE,
      category: 'coffee',
      start_at: startAt,
      area: '東京都',
      venue: '（審査用デモ会場）',
      capacity: 6,
      host_member_id: hostMemberId,
      host_name: hostNickname,
      conditions: 'App Store Review専用。本人確認済みの方。',
      description: EVENT_DESCRIPTION,
      cover_url: '',
      status: 'open',
      fee: 0,
      approval_mode: 'host_approval',
      is_user_created: true,
      is_past: false,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensurePendingApplication(admin, eventId, memberId, memberLabel, { apply }) {
  assertNotProtectedEventId(eventId, 'application event_id');

  const { data: existing } = await admin
    .from('hanakai_event_applications')
    .select('id, status, payment_method_id')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status === 'pending') {
      console.log(`[seed] application already pending member=${memberLabel}`);
      return existing.id;
    }
    if (existing.status === 'confirmed') {
      console.log(`[seed] application already confirmed member=${memberLabel} (left unchanged)`);
      return existing.id;
    }
    PLANNED_OPS.updates.push({
      table: 'hanakai_event_applications',
      key: `${memberLabel}@${eventId}`,
      action: 'status -> pending (no payment rows)',
    });
    console.log(`[seed] reset application ${existing.id} -> pending (${memberLabel})`);
    if (apply) {
      const { error } = await admin
        .from('hanakai_event_applications')
        .update({
          status: 'pending',
          reason: 'App Store review demo application',
          decided_at: null,
          payment_method_id: null,
        })
        .eq('id', existing.id);
      if (error) throw error;
    }
    return existing.id;
  }

  console.log(`[seed] insert pending application member=${memberLabel}`);
  PLANNED_OPS.creates.push({
    table: 'hanakai_event_applications',
    key: `${memberLabel}@${eventId}`,
    action: 'pending, no payment_method_id',
  });
  if (!apply) return `dry-run-app-${memberId}`;
  const { data, error } = await admin
    .from('hanakai_event_applications')
    .insert({
      event_id: eventId,
      member_id: memberId,
      status: 'pending',
      reason: 'App Store review demo application',
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
  const participantEmail = (fileEnv.HANAKAI_REVIEW_EMAIL || 'appstore-review@hanakai.kranz.design').trim().toLowerCase();
  const hostEmail = (fileEnv.HANAKAI_REVIEW_HOST_EMAIL || 'review-host@hanakai.kranz.design').trim().toLowerCase();
  const eventIdHint = (fileEnv.HANAKAI_REVIEW_APPSTORE_EVENT_ID || '').trim();

  if (eventIdHint) assertNotProtectedEventId(eventIdHint, 'HANAKAI_REVIEW_APPSTORE_EVENT_ID');

  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`[seed] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`[seed] participant=${maskEmail(participantEmail)} host=${maskEmail(hostEmail)}`);
  console.log(`[seed] protected events untouched: ${[...PROTECTED_EVENT_IDS].join(', ')}`);

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const participantAuth = await findAuthUserByEmail(admin, participantEmail);
  if (!participantAuth) {
    console.error('Participant review auth user not found');
    process.exit(1);
  }
  const hostAuth = await findAuthUserByEmail(admin, hostEmail);
  if (!hostAuth) {
    console.error('Host review auth user not found');
    process.exit(1);
  }

  const participantMemberId = await ensureReviewMember(
    admin,
    participantAuth.id,
    {
      nickname: 'レビュー太郎',
      gender: 'male',
      area: '東京都',
      age: 30,
      age_band: '30s',
      bio: 'App Store審査用の一般参加者アカウントです。',
    },
    { apply },
  );

  const hostMemberId = await ensureReviewMember(
    admin,
    hostAuth.id,
    {
      nickname: '審査主催者',
      gender: 'female',
      area: '東京都',
      age: 32,
      age_band: '30s',
      bio: 'App Store審査用の主催者アカウントです。',
    },
    { apply },
  );

  const eventId = await ensureAppStoreReviewEvent(admin, eventIdHint, hostMemberId, '審査主催者', { apply });
  assertNotProtectedEventId(eventId, 'appstore event id');

  await ensurePendingApplication(admin, eventId, participantMemberId, 'review-participant', { apply });

  PLANNED_OPS.tables = [
    'hanakai_members (participant + host review accounts only)',
    'hanakai_events (appstore review event only)',
    'hanakai_event_applications (participant pending on appstore event)',
  ];

  if (apply) {
    upsertEnvFile(SECRETS_FILE, {
      HANAKAI_REVIEW_APPSTORE_EVENT_ID: eventId,
    });
    console.log(`[seed] wrote HANAKAI_REVIEW_APPSTORE_EVENT_ID to ${SECRETS_FILE}`);
  }

  const futureStart = new Date(Date.now() + WEEKS_AHEAD * 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log('[seed] done');
  console.log(
    JSON.stringify(
      {
        protectedEventsUntouched: [...PROTECTED_EVENT_IDS],
        participantMemberId,
        hostMemberId,
        appstoreEventId: eventId,
        appstoreEventTitle: EVENT_TITLE,
        plannedStartAt: futureStart,
        paths: {
          participantEventsList: '/events',
          participantEventDetail: `/events/${eventId}`,
          hostManage: `/events/manage/${eventId}`,
        },
        plannedOperations: PLANNED_OPS,
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
