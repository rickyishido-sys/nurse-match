import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/connection/onboarding/onboarding-flow';
import { RegisterProfileSessionGate } from '@/components/connection/onboarding/register-profile-session-gate';
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

  let hasPasswordSet = false;
  let hasServerUser = false;
  let member = null;

  try {
    if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
      const supabase = await createServerSupabaseClient();
      if (!supabase) redirect('/register?error=config');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      hasServerUser = Boolean(user);

      if (!user) {
        return <RegisterProfileSessionGate hasServerUser={false} />;
      }

      hasPasswordSet = Boolean(user.user_metadata?.hanakai_password_set);

      await ensureHanakaiMemberForAuthUser(user.id, {
        email: user.email,
        nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
      });
    } else {
      hasServerUser = true;
    }

    const viewerMemberId = await getViewerMemberId();
    member = viewerMemberId ? await getMember(viewerMemberId) : null;

    const status = await getHanakaiRegistrationStatus();
    if (status.profileComplete) {
      redirect('/register/complete');
    }
  } catch (pageError) {
    console.error('REGISTER_PROFILE_PAGE_ERROR', pageError);
    throw pageError;
  }

  return (
    <RegisterProfileSessionGate hasServerUser={hasServerUser}>
      <OnboardingFlow error={error || undefined} member={member} hasPasswordSet={hasPasswordSet} />
    </RegisterProfileSessionGate>
  );
}
