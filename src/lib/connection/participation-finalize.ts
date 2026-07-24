import 'server-only';

import { randomBytes } from 'crypto';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { isConnectionAdminMember } from '@/lib/connection/group-access';
import {
  buildParticipationOutcomeNotification,
  logParticipationOutcomeNotification,
} from '@/lib/connection/notifications/participation-outcome';
import { buildParticipationDecisionPayload, logParticipationDecisionEmail } from '@/lib/connection/notifications/participation-decision';
import { getEvent, listApplications } from '@/lib/connection/repo';
import * as mock from '@/lib/connection/data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { ConnectionEvent, EventApplication } from '@/lib/connection/types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

export type FinalizeParticipantsInput = {
  eventId: string;
  selectedApplicationIds: string[];
  decidedByMemberId: string;
  /** 運営 /manage からの操作 */
  asAdmin?: boolean;
};

export type FinalizeParticipantsResult =
  | {
      ok: true;
      selectedCount: number;
      notSelectedCount: number;
      notificationsQueued: number;
    }
  | { ok: false; error: string };

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function canDecideEvent(
  event: ConnectionEvent,
  decidedByMemberId: string,
  asAdmin?: boolean,
): boolean {
  if (asAdmin && isConnectionAdminMember(decidedByMemberId)) return true;
  return event.hostId === decidedByMemberId;
}

function eventBlockedForFinalize(event: ConnectionEvent): string | null {
  if (event.isPast) return 'すでに終了した体験です';
  if (event.status === 'cancelled') return '中止された体験です';
  if (event.status === 'completed') return '完了した体験です';
  if (event.participantsDecidedAt) return 'すでに参加メンバーが決定されています';
  return null;
}

async function queueOutcomeNotifications(
  event: ConnectionEvent,
  selected: { memberId: string; token: string }[],
  notSelectedMemberIds: string[],
): Promise<number> {
  let count = 0;
  const admin = useSupabase ? createAdminSupabaseClient() : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hanakai.kranz.design';

  for (const { memberId, token } of selected) {
    const confirmUrl = `${siteUrl}/events/participation/confirm?token=${encodeURIComponent(token)}&action=confirm`;
    const notification = buildParticipationOutcomeNotification(event, 'selected', confirmUrl);
    logParticipationOutcomeNotification({
      memberId,
      eventId: event.id,
      channel: 'email_log',
      notification,
    });
    const emailPayload = buildParticipationDecisionPayload('', event, token);
    logParticipationDecisionEmail({ ...emailPayload, recipientEmail: '(member email via auth)' });

    if (admin) {
      const { data: existing } = await admin
        .from('hanakai_event_operation_notifications')
        .select('id')
        .eq('event_id', event.id)
        .eq('member_id', memberId)
        .eq('notification_type', 'participation_selected')
        .maybeSingle();
      if (!existing) {
        await admin.from('hanakai_event_operation_notifications').insert({
          event_id: event.id,
          member_id: memberId,
          notification_type: 'participation_selected',
          channel: 'in_app',
          payload: { title: notification.title, body: notification.body, confirmUrl },
        });
        count += 1;
      }
    } else {
      count += 1;
    }
  }

  for (const memberId of notSelectedMemberIds) {
    const notification = buildParticipationOutcomeNotification(event, 'not_selected');
    logParticipationOutcomeNotification({
      memberId,
      eventId: event.id,
      channel: 'in_app_outbox',
      notification,
    });

    if (admin) {
      const { data: existing } = await admin
        .from('hanakai_event_operation_notifications')
        .select('id')
        .eq('event_id', event.id)
        .eq('member_id', memberId)
        .eq('notification_type', 'participation_not_selected')
        .maybeSingle();
      if (!existing) {
        await admin.from('hanakai_event_operation_notifications').insert({
          event_id: event.id,
          member_id: memberId,
          notification_type: 'participation_not_selected',
          channel: 'in_app',
          payload: { title: notification.title, body: notification.body },
        });
        count += 1;
      }
    } else {
      count += 1;
    }
  }

  return count;
}

async function finalizeMock(
  eventId: string,
  selectedApplicationIds: string[],
  decidedByMemberId: string,
): Promise<FinalizeParticipantsResult> {
  const event = mock.getEvent(eventId);
  if (!event) return { ok: false, error: 'イベントが見つかりません' };

  const blocked = eventBlockedForFinalize(event);
  if (blocked) return { ok: false, error: blocked };

  const apps = mock.listApplications(eventId);
  const pending = apps.filter((a) => a.status === 'pending');
  if (pending.length === 0) return { ok: false, error: '選定対象の申請がありません' };

  const selectedIds = uniqueIds(selectedApplicationIds);
  if (selectedIds.length === 0) return { ok: false, error: '参加メンバーを1名以上選択してください' };
  if (selectedIds.length > event.capacity) {
    return { ok: false, error: '定員を超えて選択することはできません' };
  }

  const pendingById = new Map(pending.map((a) => [a.id, a]));
  for (const id of selectedIds) {
    if (!pendingById.has(id)) {
      return { ok: false, error: '無効な申請が含まれています' };
    }
  }

  const now = new Date().toISOString();
  event.participantsDecidedAt = now;
  event.status = 'closed';

  const selectedMembers: { memberId: string; token: string }[] = [];
  for (const appId of selectedIds) {
    const app = pendingById.get(appId)!;
    const token = generateConfirmationToken();
    app.status = 'awaiting_confirmation';
    app.confirmationToken = token;
    selectedMembers.push({ memberId: app.memberId, token });
  }

  const notSelectedMemberIds: string[] = [];
  for (const app of pending) {
    if (selectedIds.includes(app.id)) continue;
    app.status = 'rejected';
    notSelectedMemberIds.push(app.memberId);
  }

  const notificationsQueued = await queueOutcomeNotifications(
    event,
    selectedMembers,
    notSelectedMemberIds,
  );

  return {
    ok: true,
    selectedCount: selectedIds.length,
    notSelectedCount: notSelectedMemberIds.length,
    notificationsQueued,
  };
}

async function finalizeSupabase(
  eventId: string,
  selectedApplicationIds: string[],
  decidedByMemberId: string,
): Promise<FinalizeParticipantsResult> {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const event = await getEvent(eventId);
  if (!event) return { ok: false, error: 'イベントが見つかりません' };

  const blocked = eventBlockedForFinalize(event);
  if (blocked) return { ok: false, error: blocked };

  const selectedIds = uniqueIds(selectedApplicationIds);
  if (selectedIds.length === 0) return { ok: false, error: '参加メンバーを1名以上選択してください' };
  if (selectedIds.length > event.capacity) {
    return { ok: false, error: '定員を超えて選択することはできません' };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hanakai.kranz.design').replace(/\/$/, '');

  const { data, error } = await admin.rpc('hanakai_finalize_event_participants', {
    p_event_id: eventId,
    p_selected_application_ids: selectedIds,
    p_decided_by_member_id: decidedByMemberId,
    p_site_base_url: siteUrl,
    p_e2e_inject_failure: null,
  });

  if (error) {
    return { ok: false, error: error.message || '参加メンバーの決定に失敗しました' };
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    selected_count?: number;
    not_selected_count?: number;
    notifications_queued?: number;
    selected?: Array<{
      application_id: string;
      member_id: string;
      confirmation_token: string;
      confirm_url?: string | null;
    }>;
  } | null;

  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? '参加メンバーの決定に失敗しました' };
  }

  for (const row of payload.selected ?? []) {
    const confirmUrl =
      row.confirm_url ??
      `${siteUrl}/events/participation/confirm?token=${encodeURIComponent(row.confirmation_token)}&action=confirm`;
    const notification = buildParticipationOutcomeNotification(event, 'selected', confirmUrl);
    logParticipationOutcomeNotification({
      memberId: row.member_id,
      eventId: event.id,
      channel: 'email_log',
      notification,
    });
    const emailPayload = buildParticipationDecisionPayload('', event, row.confirmation_token);
    logParticipationDecisionEmail({ ...emailPayload, recipientEmail: '(member email via auth)' });
  }

  const notSelectedCount = payload.not_selected_count ?? 0;
  if (notSelectedCount > 0) {
    const notification = buildParticipationOutcomeNotification(event, 'not_selected');
    logParticipationOutcomeNotification({
      memberId: '(not_selected_batch)',
      eventId: event.id,
      channel: 'in_app_outbox',
      notification,
    });
  }

  return {
    ok: true,
    selectedCount: payload.selected_count ?? selectedIds.length,
    notSelectedCount,
    notificationsQueued: payload.notifications_queued ?? 0,
  };
}

export async function finalizeEventParticipants(
  input: FinalizeParticipantsInput,
): Promise<FinalizeParticipantsResult> {
  const event = await getEvent(input.eventId);
  if (!event) return { ok: false, error: 'イベントが見つかりません' };

  if (!canDecideEvent(event, input.decidedByMemberId, input.asAdmin)) {
    return { ok: false, error: 'この操作を行う権限がありません' };
  }

  if (event.approvalMode === 'auto') {
    return { ok: false, error: '自動承認の体験では選定操作は不要です' };
  }

  const selectedIds = uniqueIds(input.selectedApplicationIds);
  if (selectedIds.length !== input.selectedApplicationIds.filter(Boolean).length) {
    return { ok: false, error: '重複した申請が含まれています' };
  }

  if (useSupabase) {
    return finalizeSupabase(input.eventId, selectedIds, input.decidedByMemberId);
  }
  return await finalizeMock(input.eventId, selectedIds, input.decidedByMemberId);
}

export function applicationStatusHostLabel(status: EventApplication['status']): string {
  switch (status) {
    case 'awaiting_confirmation':
      return '参加確認待ち';
    case 'confirmed':
      return '参加確定';
    case 'cancelled':
      return '辞退';
    case 'rejected':
      return '今回のご案内なし';
    case 'pending':
      return '選定待ち';
    default:
      return status;
  }
}

export async function eventHasPendingSelection(eventId: string): Promise<boolean> {
  const apps = await listApplications(eventId);
  return apps.some((a) => a.status === 'pending');
}
