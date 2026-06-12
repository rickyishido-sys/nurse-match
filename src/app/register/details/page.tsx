import { RegisterDetailsFlow } from '@/components/register-details-flow';
import { USE_MOCK_DATA } from '@/lib/config';
import { getCurrentUser } from '@/lib/data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/guard';

type RegisterDetailsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterDetailsPage({ searchParams }: RegisterDetailsPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = pickFirst(params.error);

  if (USE_MOCK_DATA) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'user') redirect('/register');
    if (isAdminRole(user.role)) redirect('/register');
    return (
      <RegisterDetailsFlow
        error={error}
        defaults={{
          gender: user.gender,
          nickname: user.nickname,
          birthdate: user.birthdate,
          location: user.location,
          desiredGender: user.desiredGender,
        }}
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  if (!supabase) redirect('/register');

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) {
    console.log('REGISTER_DETAILS_AUTH_GUARD', { hasUser: false, reason: 'no_user' });
    redirect('/register');
  }
  console.log('REGISTER_DETAILS_AUTH_GUARD', {
    hasUser: true,
    userId: authUser.id,
    emailConfirmedAt: authUser.email_confirmed_at,
    phoneConfirmedAt: authUser.phone_confirmed_at,
  });

  let userRow: {
    role?: string | null;
    gender?: string | null;
    nickname?: string | null;
    birthdate?: string | null;
    location?: string | null;
    seeking_gender?: string | null;
    desired_gender?: string | null;
  } | null = null;

  if (adminSupabase) {
    const { data } = await adminSupabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
    userRow = data;
  } else {
    // Service-role key might be unavailable in some environments.
    // Continue registration with session user and safe defaults.
    console.warn('REGISTER_DETAILS_ADMIN_CLIENT_UNAVAILABLE');
  }
  if (userRow && userRow.role !== 'user') redirect('/register');

  return (
    <RegisterDetailsFlow
      error={error}
      defaults={{
        gender: (userRow?.gender ?? 'female') as 'female' | 'male',
        nickname: userRow?.nickname ?? '',
        birthdate: userRow?.birthdate ?? '',
        location: userRow?.location ?? '',
        desiredGender: ((userRow?.seeking_gender ?? userRow?.desired_gender ?? 'both') as 'male' | 'female' | 'both'),
      }}
    />
  );
}
