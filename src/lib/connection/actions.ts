'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { applyToEvent, confirmMemberForEvent, removeMemberFromEvent } from '@/lib/connection/data';

// Mock viewer ID for MVP (logged-in user stands in as m1).
const MOCK_VIEWER_ID = 'm1';

export async function applyConnectionEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  console.log('CONNECTION_APPLY', { eventId, memberId: MOCK_VIEWER_ID });
  if (eventId) applyToEvent(eventId, MOCK_VIEWER_ID);
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/manage');
  redirect(`/events/${eventId}?applied=1`);
}

export async function confirmMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_CONFIRM', { eventId, memberId });
  if (eventId && memberId) confirmMemberForEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function removeMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_REMOVE', { eventId, memberId });
  if (eventId && memberId) removeMemberFromEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function followMemberAction(formData: FormData) {
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  console.log('CONNECTION_FOLLOW', { memberId, eventId });
  revalidatePath(`/connections/${eventId}`);
  redirect(`/connections/${eventId}?followed=${memberId}`);
}

export async function sendMessageAction(formData: FormData) {
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  console.log('CONNECTION_MESSAGE', { memberId, eventId, hasBody: body.length > 0 });
  revalidatePath(`/connections/${eventId}`);
  redirect(`/connections/${eventId}?messaged=${memberId}`);
}

export async function saveProfileAction(formData: FormData) {
  const nickname = String(formData.get('nickname') ?? '').trim();
  console.log('CONNECTION_PROFILE_SAVE', {
    nickname,
    motivations: formData.getAll('motivations'),
  });
  if (!nickname) redirect('/register/profile?error=nickname');
  redirect('/events?registered=1');
}
