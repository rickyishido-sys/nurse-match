import 'server-only';

import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

export type MemberBlock = {
  id: string;
  blockerMemberId: string;
  blockedMemberId: string;
  createdAt: string;
};

async function db() {
  return createServerSupabaseClient();
}

export async function listBlockedMemberIds(blockerMemberId: string): Promise<string[]> {
  if (!useSupabase) return [];
  const sb = await db();
  if (!sb) return [];
  const { data } = await sb
    .from('hanakai_member_blocks')
    .select('blocked_member_id')
    .eq('blocker_member_id', blockerMemberId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => String(r.blocked_member_id));
}

/**
 * Members whose UGC should be hidden from the viewer:
 * - people the viewer blocked (session RLS)
 * - people who blocked the viewer (admin read; reverse rows are not visible under blocker-only RLS)
 */
export async function listHiddenMemberIdsForViewer(viewerMemberId: string): Promise<string[]> {
  if (!useSupabase || !viewerMemberId) return [];
  const blockedByMe = await listBlockedMemberIds(viewerMemberId);
  const hidden = new Set(blockedByMe);

  const admin = createAdminSupabaseClient();
  if (admin) {
    const { data } = await admin
      .from('hanakai_member_blocks')
      .select('blocker_member_id')
      .eq('blocked_member_id', viewerMemberId);
    for (const row of data ?? []) {
      hidden.add(String(row.blocker_member_id));
    }
  }

  return [...hidden];
}

/** Soft-fail admin-visible moderation record for Apple Guideline 1.2 (reuses hanakai_reports). */
export async function recordBlockModerationEvent(
  blockerMemberId: string,
  blockedMemberId: string,
): Promise<void> {
  if (!useSupabase) return;
  const sb = await db();
  if (!sb) return;

  const description =
    '[user_block] ユーザーが他のメンバーをブロックしました。対象メンバーのコンテンツはフィードから除外されます。';

  const { error } = await sb.from('hanakai_reports').insert({
    reporter_member_id: blockerMemberId,
    target_type: 'member',
    target_id: blockedMemberId,
    target_member_id: blockedMemberId,
    target_event_id: null,
    category: 'other',
    description,
    reason: 'user_block',
    detail: description,
    status: 'new',
  });

  if (error) {
    console.warn('HANAKAI_BLOCK_MODERATION_RECORD_SKIP', {
      blockerMemberId,
      blockedMemberId,
      message: error.message,
      code: error.code,
    });
  }
}

export async function listBlocks(blockerMemberId: string): Promise<MemberBlock[]> {
  if (!useSupabase) return [];
  const sb = await db();
  if (!sb) return [];
  const { data } = await sb
    .from('hanakai_member_blocks')
    .select('*')
    .eq('blocker_member_id', blockerMemberId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: String(r.id),
    blockerMemberId: String(r.blocker_member_id),
    blockedMemberId: String(r.blocked_member_id),
    createdAt: String(r.created_at),
  }));
}

export async function isMemberBlocked(blockerMemberId: string, blockedMemberId: string): Promise<boolean> {
  if (!useSupabase || blockerMemberId === blockedMemberId) return false;
  const sb = await db();
  if (!sb) return false;
  const { data } = await sb
    .from('hanakai_member_blocks')
    .select('id')
    .eq('blocker_member_id', blockerMemberId)
    .eq('blocked_member_id', blockedMemberId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function blockMember(
  blockerMemberId: string,
  blockedMemberId: string,
): Promise<{ ok: true; alreadyBlocked?: boolean } | { ok: false; error: string }> {
  if (blockerMemberId === blockedMemberId) return { ok: false, error: 'self_block' };
  if (!useSupabase) return { ok: true, alreadyBlocked: false };

  const sb = await db();
  if (!sb) return { ok: false, error: 'db_unavailable' };

  const { error } = await sb.from('hanakai_member_blocks').insert({
    blocker_member_id: blockerMemberId,
    blocked_member_id: blockedMemberId,
  });

  if (error) {
    if (error.code === '23505') return { ok: true, alreadyBlocked: true };
    return { ok: false, error: error.message };
  }
  return { ok: true, alreadyBlocked: false };
}

export async function unblockMember(
  blockerMemberId: string,
  blockedMemberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!useSupabase) return { ok: true };
  const sb = await db();
  if (!sb) return { ok: false, error: 'db_unavailable' };

  const { error } = await sb
    .from('hanakai_member_blocks')
    .delete()
    .eq('blocker_member_id', blockerMemberId)
    .eq('blocked_member_id', blockedMemberId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
