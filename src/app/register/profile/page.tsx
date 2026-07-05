import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/connection/onboarding/onboarding-flow';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { ensureHanakaiMemberForAuthUser, getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import { getHanakaiRegistrationStatus } from '@/lib/connection/registration-status';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterProfilePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);

  if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
    const supabase = await createServerSupabaseClient();
    if (!supabase) redirect('/register?error=config');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect('/register?hint=auth-required');
    }

    await ensureHanakaiMemberForAuthUser(user.id, {
      email: user.email,
      nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    });
  }

  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;

  const status = await getHanakaiRegistrationStatus();
  if (status.profileComplete) {
    redirect('/register/complete');
  }

  return <OnboardingFlow error={error || undefined} member={member} />;
}
