import { CompletionView } from '@/components/connection/onboarding/completion-view';
import { getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { PERSONALITY_TYPE_META } from '@/lib/connection/personality';

export default async function RegisterCompletePage() {
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;
  const personality = member?.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;

  return <CompletionView nickname={member?.nickname} personality={personality} />;
}
