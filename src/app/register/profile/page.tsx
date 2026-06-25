import { OnboardingFlow } from '@/components/connection/onboarding/onboarding-flow';
import { getMember } from '@/lib/connection/data';

const MOCK_VIEWER_ID = 'm1';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterProfilePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);
  const member = getMember(MOCK_VIEWER_ID);

  return <OnboardingFlow error={error || undefined} member={member} />;
}
