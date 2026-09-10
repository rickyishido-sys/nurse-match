'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  blockMember,
  recordBlockModerationEvent,
  unblockMember,
} from '@/lib/connection/block-repo';
import { ensureViewerMemberId } from '@/lib/connection/identity';

export type BlockMemberActionResult =
  | { ok: true; alreadyBlocked?: boolean; returnTo: string }
  | { ok: false; error: 'login_required' | 'missing_target' | 'block_failed'; loginNext?: string };

/**
 * Block a member and return a result (no redirect).
 * iPhone/WebKit: awaiting redirect() inside a client form action wrapper can no-op.
 * The client shows pending/success UI, then hard-navigates with window.location.assign.
 */
export async function blockMemberAction(formData: FormData): Promise<BlockMemberActionResult> {
  const blockedMemberId = String(formData.get('blockedMemberId') ?? '').trim();
  const rawReturnTo = String(formData.get('returnTo') ?? '/connections').trim();
  const returnTo =
    rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/connections';

  const memberId = await ensureViewerMemberId();
  if (!memberId) {
    return { ok: false, error: 'login_required', loginNext: `/login?next=${encodeURIComponent(returnTo)}` };
  }
  if (!blockedMemberId) {
    return { ok: false, error: 'missing_target' };
  }

  const result = await blockMember(memberId, blockedMemberId);
  if (!result.ok) {
    return { ok: false, error: 'block_failed' };
  }

  // Soft-fail: block must succeed even if moderation inbox write fails.
  // Skip duplicate moderation rows when the block already existed.
  if (!result.alreadyBlocked) {
    await recordBlockModerationEvent(memberId, blockedMemberId);
  }

  revalidatePath('/account/blocked');
  revalidatePath(`/profile/${blockedMemberId}`);
  revalidatePath('/connections');
  revalidatePath('/groups');
  revalidatePath('/admin/hanakai/reports');

  return { ok: true, alreadyBlocked: result.alreadyBlocked, returnTo };
}

export async function unblockMemberAction(formData: FormData) {
  const blockedMemberId = String(formData.get('blockedMemberId') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/login?next=/account/blocked');
  if (!blockedMemberId) redirect('/account/blocked?error=unblock_missing');

  const result = await unblockMember(memberId, blockedMemberId);
  if (!result.ok) redirect('/account/blocked?error=unblock_failed');

  revalidatePath('/account/blocked');
  revalidatePath(`/profile/${blockedMemberId}`);
  revalidatePath('/connections');
  revalidatePath('/groups');
  redirect('/account/blocked?unblocked=1');
}
