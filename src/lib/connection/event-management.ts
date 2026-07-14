import 'server-only';

import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { isConnectionAdminMember } from '@/lib/connection/group-access';
import { getEvent, listApplications } from '@/lib/connection/repo';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { ConnectionEventCategory, EventApprovalMode, EventRecruitmentType } from '@/lib/connection/types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

export type UpdateEventInput = {
  title: string;
  category: ConnectionEventCategory;
  description: string;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  fee: number;
  conditions: string;
  approvalMode: EventApprovalMode;
  recruitmentType: EventRecruitmentType;
  coverUrl?: string;
  imageUrls?: string[];
  status?: 'open' | 'closed';
};

export async function canEditEvent(eventId: string, memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const event = await getEvent(eventId);
  if (!event) return false;
  if (isConnectionAdminMember(memberId)) return true;
  return event.hostId === memberId;
}

export async function updateEventById(
  eventId: string,
  memberId: string,
  input: UpdateEventInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = await canEditEvent(eventId, memberId);
  if (!allowed) return { ok: false, error: '権限がありません' };
  if (!useSupabase) return { ok: true };

  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const patch: Record<string, unknown> = {
    title: input.title,
    category: input.category,
    description: input.description,
    start_at: input.startAt,
    area: input.area,
    venue: input.venue,
    capacity: input.capacity,
    fee: input.fee,
    conditions: input.conditions,
    approval_mode: input.approvalMode,
    recruitment_type: input.recruitmentType,
  };
  if (input.status) patch.status = input.status;
  if (input.coverUrl !== undefined) patch.cover_url = input.coverUrl;
  if (input.imageUrls !== undefined) patch.image_urls = input.imageUrls;

  const { error } = await admin.from('hanakai_events').update(patch).eq('id', eventId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelEventById(
  eventId: string,
  memberId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = await canEditEvent(eventId, memberId);
  if (!allowed) return { ok: false, error: '権限がありません' };

  const apps = await listApplications(eventId);
  const hasParticipants = apps.some((a) => a.status === 'confirmed' || a.status === 'awaiting_confirmation');

  if (!hasParticipants) {
    return deleteEventById(eventId, memberId);
  }

  if (!useSupabase) return { ok: true };

  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const now = new Date().toISOString();
  const { error } = await admin
    .from('hanakai_events')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      cancellation_reason: reason.trim() || null,
    })
    .eq('id', eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteEventById(
  eventId: string,
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = await canEditEvent(eventId, memberId);
  if (!allowed) return { ok: false, error: '権限がありません' };

  const apps = await listApplications(eventId);
  const hasAny = apps.some((a) => a.status !== 'rejected' && a.status !== 'cancelled');
  if (hasAny) {
    return { ok: false, error: '参加者がいるイベントは削除できません。中止をご利用ください。' };
  }

  if (!useSupabase) return { ok: true };

  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { error } = await admin.from('hanakai_events').delete().eq('id', eventId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
