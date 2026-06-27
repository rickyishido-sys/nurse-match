import { OnboardingFlow } from '@/components/connection/onboarding/onboarding-flow';
import { getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterProfilePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;

  return <OnboardingFlow error={error || undefined} member={member} />;
}
