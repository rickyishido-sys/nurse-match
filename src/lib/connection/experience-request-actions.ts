'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedAuthUserId } from '@/lib/connection/identity';
import {
  parseExperienceRequestForm,
  submitExperienceRequest,
} from '@/lib/connection/experience-request';

export async function submitExperienceRequestAction(formData: FormData) {
  const parsed = parseExperienceRequestForm(formData);
  if (!parsed) {
    redirect('/experience-request?error=required');
  }

  const userId = await getAuthenticatedAuthUserId();
  await submitExperienceRequest({ ...parsed, userId });

  revalidatePath('/manage/experience-requests');
  redirect('/experience-request?sent=1');
}
