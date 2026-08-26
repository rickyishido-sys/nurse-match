#!/usr/bin/env node
/**
 * READ-ONLY Production investigation for App Store review accounts & events.
 * Never prints passwords or service role keys.
 *
 * Usage: node scripts/investigate-hanakai-review-accounts.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PARTICIPANT_EMAIL = 'appstore-review@hanakai.kranz.design';
const HOST_EMAIL = 'review-host@hanakai.kranz.design';
const LEGACY_EVENT_ID = 'a27f5be8-a875-461c-9fd1-adfb936410ff';
const COMMUNITY_EVENT_ID = '8554e519-52a7-49b9-ad66-fa33b7a395db';

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

function maskEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return '(invalid)';
  return `${u.slice(0, 2)}***@${d}`;
}

function computeIsPast(row) {
  return row.is_past === true || new Date(row.start_at).getTime() < Date.now();
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

async function memberSummary(admin, authUserId) {
  const { data } = await admin
    .from('hanakai_members')
    .select(
      'id, nickname, status, deleted_at, identity_verified, trust_verification_status, document_upload_status, area, gender, age',
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data;
}

async function appsForMember(admin, memberId) {
  const { data } = await admin
    .from('hanakai_event_applications')
    .select('id, event_id, status, payment_method_id')
    .eq('member_id', memberId);
  return data ?? [];
}

async function eventsHosted(admin, memberId) {
  const { data } = await admin
    .from('hanakai_events')
    .select('id, title, start_at, is_past, status, fee, host_member_id')
    .eq('host_member_id', memberId)
    .order('start_at', { ascending: true });
  return (data ?? []).map((e) => ({ ...e, computedIsPast: computeIsPast(e), visibleOnEventsList: !computeIsPast(e) }));
}

async function eventSnapshot(admin, eventId) {
  const { data } = await admin
    .from('hanakai_events')
    .select('id, title, start_at, is_past, status, fee, host_member_id, approval_mode, is_user_created')
    .eq('id', eventId)
    .maybeSingle();
  if (!data) return null;
  return { ...data, computedIsPast: computeIsPast(data), visibleOnEventsList: !computeIsPast(data) };
}

async function paymentCountForEvent(admin, eventId) {
  const { count, error } = await admin
    .from('hanakai_participation_payments')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function upcomingEventsVisibleOnList(admin) {
  const { data } = await admin
    .from('hanakai_events')
    .select('id, title, start_at, is_past, status, host_member_id')
    .order('start_at', { ascending: true });
  return (data ?? [])
    .map((e) => ({ ...e, computedIsPast: computeIsPast(e) }))
    .filter((e) => !e.computedIsPast);
}

async function summarizeAccount(admin, email) {
  const auth = await findAuthUserByEmail(admin, email);
  if (!auth) {
    return { email: maskEmail(email), authExists: false };
  }
  const member = await memberSummary(admin, auth.id);
  const apps = member?.id ? await appsForMember(admin, member.id) : [];
  const hosted = member?.id ? await eventsHosted(admin, member.id) : [];
  return {
    email: maskEmail(email),
    authExists: true,
    authUserId: auth.id,
    emailConfirmed: !!auth.email_confirmed_at,
    lastSignInAt: auth.last_sign_in_at ?? null,
    member: member
      ? {
          id: member.id,
          nickname: member.nickname,
          status: member.status,
          deleted_at: member.deleted_at,
          identity_verified: member.identity_verified,
          trust_verification_status: member.trust_verification_status,
          document_upload_status: member.document_upload_status,
          canApplyOrHost: member.identity_verified === true && member.status === 'active' && !member.deleted_at,
        }
      : null,
    applicationCount: apps.length,
    applications: apps.map((a) => ({
      event_id: a.event_id,
      status: a.status,
      hasPaymentMethodId: !!a.payment_method_id,
    })),
    hostedEvents: hosted,
    upcomingHostedVisible: hosted.filter((e) => e.visibleOnEventsList),
  };
}

async function main() {
  const fileEnv = {
    ...loadEnvFile(resolve(ROOT, '.env.local')),
    ...loadEnvFile(resolve(ROOT, '.env.production.local')),
    ...loadEnvFile(resolve(ROOT, '.env.secrets.local')),
    ...process.env,
  };
  const url = (fileEnv.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRole = fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [participant, host, legacy, community, upcomingVisible] = await Promise.all([
    summarizeAccount(admin, PARTICIPANT_EMAIL),
    summarizeAccount(admin, HOST_EMAIL),
    eventSnapshot(admin, LEGACY_EVENT_ID),
    eventSnapshot(admin, COMMUNITY_EVENT_ID),
    upcomingEventsVisibleOnList(admin),
  ]);

  const legacyPayments = await paymentCountForEvent(admin, LEGACY_EVENT_ID);
  const communityPayments = await paymentCountForEvent(admin, COMMUNITY_EVENT_ID);

  console.log(
    JSON.stringify(
      {
        investigatedAt: new Date().toISOString(),
        participant,
        host,
        protectedEvents: {
          legacy: legacy,
          community: community,
        },
        eventsListUpcomingCount: upcomingVisible.length,
        eventsListUpcoming: upcomingVisible.map((e) => ({
          id: e.id,
          title: e.title,
          start_at: e.start_at,
          status: e.status,
        })),
        payments: { legacy: legacyPayments, community: communityPayments },
        codeNotes: {
          eventsPageFilter: 'listEvents().filter(e => !e.isPast)',
          isPastRule: 'row.is_past === true OR start_at < now',
          hostManagePath: '/events/manage/{eventId} (host_member_id must match)',
          managePath: '/manage requires HANAKAI_CONNECTION_ADMIN_MEMBER_IDS',
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('[investigate] FAILED', err?.message || err);
  process.exit(1);
});
