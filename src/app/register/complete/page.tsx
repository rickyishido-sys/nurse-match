import { redirect } from 'next/navigation';
import { CompletionView } from '@/components/connection/onboarding/completion-view';
import { getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiRegistrationStatus } from '@/lib/connection/registration-status';
import { PERSONALITY_TYPE_META } from '@/lib/connection/personality';

export default async function RegisterCompletePage() {
  const registration = await getHanakaiRegistrationStatus();
  if (!registration.isAuthenticated) redirect('/register');
  if (!registration.profileComplete) redirect('/register/profile');

  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;
  const personality = member?.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;

  return <CompletionView nickname={member?.nickname} personality={personality} />;
}
