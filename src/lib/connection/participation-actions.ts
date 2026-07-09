'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  confirmParticipationByToken,
  declineParticipationByToken,
} from '@/lib/connection/participation-confirmation';

export async function confirmParticipationAction(token: string) {
  const result = await confirmParticipationByToken(token);
  if (!result.ok) {
    redirect(`/events/participation/confirm?token=${encodeURIComponent(token)}&error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/events/${result.eventId}`);
  revalidatePath('/events');
  revalidatePath('/admin/hanakai/applications');
}

export async function declineParticipationAction(token: string) {
  const result = await declineParticipationByToken(token);
  if (!result.ok) {
    redirect(`/events/participation/confirm?token=${encodeURIComponent(token)}&error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/events/${result.eventId}`);
  revalidatePath('/events');
  revalidatePath('/admin/hanakai/applications');
}
