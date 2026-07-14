import 'server-only';

import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
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
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (blockerMemberId === blockedMemberId) return { ok: false, error: 'self_block' };
  if (!useSupabase) return { ok: true };

  const sb = await db();
  if (!sb) return { ok: false, error: 'db_unavailable' };

  const { error } = await sb.from('hanakai_member_blocks').insert({
    blocker_member_id: blockerMemberId,
    blocked_member_id: blockedMemberId,
  });

  if (error) {
    if (error.code === '23505') return { ok: true };
    return { ok: false, error: error.message };
  }
  return { ok: true };
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
