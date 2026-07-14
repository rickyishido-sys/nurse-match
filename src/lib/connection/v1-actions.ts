'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { ensureViewerMemberId } from '@/lib/connection/identity';
import { cancelParticipationByMember } from '@/lib/connection/participation-cancel';
import { cancelEventById, deleteEventById, updateEventById } from '@/lib/connection/event-management';
import type { ConnectionEventCategory, EventApprovalMode, EventRecruitmentType } from '@/lib/connection/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const FORGOT_PASSWORD_COOLDOWN_MS = 60_000;
const lastForgotByEmail = new Map<string, number>();

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    redirect('/forgot-password?error=invalid_email');
  }

  const last = lastForgotByEmail.get(email) ?? 0;
  if (Date.now() - last < FORGOT_PASSWORD_COOLDOWN_MS) {
    redirect('/forgot-password/sent');
  }
  lastForgotByEmail.set(email, Date.now());

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const redirectTo = `${SITE_URL}/api/auth/callback?next=/reset-password`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  }

  redirect('/forgot-password/sent');
}

export async function cancelParticipationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const cancelReason = String(formData.get('cancelReason') ?? '').trim();
  const returnTo = String(formData.get('returnTo') ?? `/events/${eventId}`).trim();

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!eventId) redirect('/events?error=cancel_missing');

  const result = await cancelParticipationByMember(eventId, memberId, cancelReason);
  if (!result.ok) {
    redirect(`${returnTo}?cancel_error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/my-profile');
  revalidatePath('/admin/hanakai/applications');
  redirect(`${returnTo}?cancelled=1`);
}

export async function updateEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=/events/edit/${eventId}`);
  if (!eventId) redirect('/events');

  const imageUrlsRaw = String(formData.get('imageUrls') ?? '').trim();
  const imageUrls = imageUrlsRaw ? imageUrlsRaw.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

  const result = await updateEventById(eventId, memberId, {
    title: String(formData.get('title') ?? '').trim(),
    category: String(formData.get('category') ?? 'other') as ConnectionEventCategory,
    description: String(formData.get('description') ?? '').trim(),
    startAt: String(formData.get('startAt') ?? '').trim(),
    area: String(formData.get('area') ?? '').trim(),
    venue: String(formData.get('venue') ?? '').trim(),
    capacity: Number(formData.get('capacity')) || 6,
    fee: Number(formData.get('fee')) || 0,
    conditions: String(formData.get('conditions') ?? '').trim(),
    approvalMode: String(formData.get('approvalMode') ?? 'host_approval') as EventApprovalMode,
    recruitmentType: (String(formData.get('recruitmentType') ?? 'standard') as EventRecruitmentType),
    coverUrl: imageUrls?.[0],
    imageUrls,
    status: formData.get('isPublic') === '0' ? 'closed' : 'open',
  });

  if (!result.ok) redirect(`/events/edit/${eventId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/admin/hanakai/events');
  redirect(`/events/${eventId}?updated=1`);
}

export async function cancelEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=/events/edit/${eventId}`);
  if (!eventId || !reason) redirect(`/events/edit/${eventId}?error=reason_required`);

  const result = await cancelEventById(eventId, memberId, reason);
  if (!result.ok) redirect(`/events/edit/${eventId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath('/events');
  revalidatePath('/admin/hanakai/events');
  redirect('/events?cancelled_event=1');
}

export async function deleteEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=/events/edit/${eventId}`);
  if (!eventId) redirect('/events');

  const result = await deleteEventById(eventId, memberId);
  if (!result.ok) redirect(`/events/edit/${eventId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath('/events');
  revalidatePath('/admin/hanakai/events');
  redirect('/events?deleted_event=1');
}
