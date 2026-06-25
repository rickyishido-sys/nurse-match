import { CompletionView } from '@/components/connection/onboarding/completion-view';
import { getMember } from '@/lib/connection/data';
import { PERSONALITY_TYPE_META } from '@/lib/connection/personality';

const MOCK_VIEWER_ID = 'm1';

export default function RegisterCompletePage() {
  const member = getMember(MOCK_VIEWER_ID);
  const personality = member?.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;

  return <CompletionView nickname={member?.nickname} personality={personality} />;
}
