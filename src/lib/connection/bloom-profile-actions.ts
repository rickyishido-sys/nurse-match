'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveBloomVisibility } from '@/lib/connection/bloom-profile';
import { getViewerMemberId } from '@/lib/connection/identity';

export async function updateBloomVisibilityAction(formData: FormData) {
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile');

  await saveBloomVisibility(memberId, {
    showAiIntro: formData.get('showAiIntro') === '1',
    showBloomSummary: formData.get('showBloomSummary') === '1',
    showConversationStarters: formData.get('showConversationStarters') === '1',
    showBloomTags: formData.get('showBloomTags') === '1',
    showConnectionStyle: formData.get('showConnectionStyle') === '1',
  });

  revalidatePath('/my-profile');
  revalidatePath(`/profile/${memberId}`);
  redirect('/my-profile?bloomSaved=1');
}
