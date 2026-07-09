import 'server-only';

import { randomBytes } from 'crypto';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import {
  buildParticipationDecisionPayload,
  logParticipationDecisionEmail,
} from '@/lib/connection/notifications/participation-decision';
import { getEvent, getMember } from '@/lib/connection/repo';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

async function adminDb() {
  if (!useSupabase) return null;
  return createAdminSupabaseClient();
}

async function serverDb() {
  if (!useSupabase) return null;
  return createServerSupabaseClient();
}

/** 運営・主催が選考後、参加確認待ちにする */
export async function selectMemberForEvent(
  eventId: string,
  memberId: string,
  decidedByMemberId?: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const event = await getEvent(eventId);
  if (!event) return { ok: false, error: 'イベントが見つかりません' };

  const token = generateConfirmationToken();
  const now = new Date().toISOString();

  if (!useSupabase) {
    return { ok: true, token };
  }

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  if (fetchErr || !app) return { ok: false, error: '申請が見つかりません' };
  if (app.status !== 'pending') return { ok: false, error: 'この申請はすでに処理済みです' };

  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'awaiting_confirmation',
      decided_at: now,
      decided_by_member_id: decidedByMemberId ?? null,
      confirmation_token: token,
      confirmed_at: null,
    })
    .eq('id', app.id);

  if (updateErr) return { ok: false, error: updateErr.message };

  const member = await getMember(memberId);
  if (member) {
    const payload = buildParticipationDecisionPayload('', event, token);
    logParticipationDecisionEmail({ ...payload, recipientEmail: '(member email via auth)' });
  }

  return { ok: true, token };
}

export async function confirmParticipationByToken(
  token: string,
): Promise<{ ok: true; eventId: string } | { ok: false; error: string }> {
  if (!token.trim()) return { ok: false, error: '無効なリンクです' };

  if (!useSupabase) {
    return { ok: false, error: '確認できませんでした' };
  }

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, event_id, member_id, status')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (fetchErr || !app) return { ok: false, error: 'リンクが無効か、期限切れです' };
  if (app.status === 'confirmed') return { ok: true, eventId: String(app.event_id) };
  if (app.status !== 'awaiting_confirmation') return { ok: false, error: 'この申請は確認できません' };

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'confirmed',
      confirmed_at: now,
      confirmation_token: null,
    })
    .eq('id', app.id);

  if (updateErr) return { ok: false, error: updateErr.message };

  await adminSyncGroupForConfirmedMember(String(app.event_id), String(app.member_id));

  return { ok: true, eventId: String(app.event_id) };
}

export async function declineParticipationByToken(
  token: string,
): Promise<{ ok: true; eventId: string } | { ok: false; error: string }> {
  if (!token.trim()) return { ok: false, error: '無効なリンクです' };

  if (!useSupabase) {
    return { ok: false, error: '確認できませんでした' };
  }

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, event_id, status')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (fetchErr || !app) return { ok: false, error: 'リンクが無効か、期限切れです' };
  if (app.status === 'cancelled') return { ok: true, eventId: String(app.event_id) };
  if (app.status !== 'awaiting_confirmation') return { ok: false, error: 'この申請は辞退できません' };

  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'cancelled',
      confirmation_token: null,
    })
    .eq('id', app.id);

  if (updateErr) return { ok: false, error: updateErr.message };

  return { ok: true, eventId: String(app.event_id) };
}

async function adminSyncGroupForConfirmedMember(
  eventId: string,
  memberId: string,
): Promise<void> {
  const admin = await adminDb();
  if (!admin) return;

  const { data: group } = await admin
    .from('hanakai_connection_groups')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  let groupId = group?.id as string | undefined;
  if (!groupId) {
    const { data: created } = await admin
      .from('hanakai_connection_groups')
      .insert({ event_id: eventId })
      .select('id')
      .single();
    groupId = created?.id as string | undefined;
  }
  if (!groupId) return;

  await admin.from('hanakai_group_members').upsert(
    { group_id: groupId, member_id: memberId, role: 'participant' },
    { onConflict: 'group_id,member_id' },
  );
}

export async function updateEventRecruitmentType(
  eventId: string,
  recruitmentType: 'standard' | 'additional',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!useSupabase) return { ok: true };

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { error } = await admin
    .from('hanakai_events')
    .update({ recruitment_type: recruitmentType })
    .eq('id', eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getApplicationByConfirmationToken(token: string) {
  const sb = await serverDb();
  if (!sb || !token) return null;

  const { data } = await sb
    .from('hanakai_event_applications')
    .select('id, event_id, member_id, status, confirmation_token')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (!data) return null;
  return {
    id: String(data.id),
    eventId: String(data.event_id),
    memberId: String(data.member_id),
    status: data.status as string,
    confirmationToken: data.confirmation_token as string | null,
  };
}
