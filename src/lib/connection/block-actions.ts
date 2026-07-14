'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { blockMember, unblockMember } from '@/lib/connection/block-repo';
import { ensureViewerMemberId } from '@/lib/connection/identity';

export async function blockMemberAction(formData: FormData) {
  const blockedMemberId = String(formData.get('blockedMemberId') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? '/my-profile').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!blockedMemberId) redirect(`${returnTo}?error=block_missing`);

  const result = await blockMember(memberId, blockedMemberId);
  if (!result.ok) {
    redirect(`${returnTo}?error=block_failed`);
  }

  revalidatePath('/account/blocked');
  revalidatePath(`/profile/${blockedMemberId}`);
  revalidatePath('/connections');
  redirect(`${returnTo}?blocked=1`);
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
  redirect('/account/blocked?unblocked=1');
}
