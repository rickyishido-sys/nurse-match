import 'server-only';

import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { getEvent } from '@/lib/connection/repo';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { EventApplicationStatus } from '@/lib/connection/types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

const CANCELLABLE: EventApplicationStatus[] = ['pending', 'awaiting_confirmation', 'confirmed'];

export type CancelParticipationResult =
  | { ok: true; eventId: string }
  | { ok: false; error: 'not_found' | 'forbidden' | 'not_cancellable' | 'event_started' | 'already_cancelled' | 'db_error'; message: string };

export async function cancelParticipationByMember(
  eventId: string,
  memberId: string,
  cancelReason?: string,
): Promise<CancelParticipationResult> {
  const event = await getEvent(eventId);
  if (!event) return { ok: false, error: 'not_found', message: 'イベントが見つかりません' };

  if (event.isPast || new Date(event.startAt).getTime() <= Date.now()) {
    return {
      ok: false,
      error: 'event_started',
      message: 'イベント開始後はアプリからキャンセルできません。お問い合わせよりご連絡ください。',
    };
  }

  if (!useSupabase) return { ok: true, eventId };

  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'db_error', message: 'しばらくしてから再度お試しください' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, status, member_id')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  if (fetchErr || !app) {
    return { ok: false, error: 'not_found', message: '参加申請が見つかりません' };
  }

  if (app.status === 'cancelled') {
    return { ok: false, error: 'already_cancelled', message: 'すでにキャンセル済みです' };
  }

  if (!CANCELLABLE.includes(app.status as EventApplicationStatus)) {
    return { ok: false, error: 'not_cancellable', message: 'この申請はキャンセルできません' };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      cancel_reason: cancelReason?.trim() || null,
      confirmation_token: null,
    })
    .eq('id', app.id)
    .eq('member_id', memberId);

  if (updateErr) return { ok: false, error: 'db_error', message: 'キャンセルに失敗しました' };

  return { ok: true, eventId };
}
