import { RegisterDetailsFlow } from '@/components/register-details-flow';
import { USE_MOCK_DATA } from '@/lib/config';
import { getCurrentUser, getFemaleProfileByUserId, getMaleProfileByUserId } from '@/lib/data';
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
    const female = await getFemaleProfileByUserId(user.id);
    const male = await getMaleProfileByUserId(user.id);

    return (
      <RegisterDetailsFlow
        error={error}
        defaults={{
          gender: user.gender,
          nickname: user.nickname,
          birthdate: user.birthdate,
          location: user.location,
          bio: user.bio,
          desiredGender: user.desiredGender,
          workplaceType: female?.workplaceType ?? 'hospital',
          hasNightShift: female?.hasNightShift ?? false,
          job: male?.job ?? '',
          income: male?.income ?? '',
          maritalStatus: male?.maritalStatus ?? 'single',
          height: String(male?.height ?? 170),
          smoking: male?.smoking ?? '',
          drinking: male?.drinking ?? '',
          nightShiftUnderstanding: male?.nightShiftUnderstanding ?? false,
          shiftWorkUnderstanding: male?.shiftWorkUnderstanding ?? false,
        }}
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  if (!supabase || !adminSupabase) redirect('/register');

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) redirect('/register');
  if (!authUser.email_confirmed_at && !authUser.phone_confirmed_at) redirect('/register');

  const [{ data: userRow }, { data: femaleRow }, { data: maleRow }] = await Promise.all([
    adminSupabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
    adminSupabase.from('female_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    adminSupabase.from('male_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
  ]);
  if (userRow && userRow.role !== 'user') redirect('/register');

  return (
    <RegisterDetailsFlow
      error={error}
      defaults={{
        gender: (userRow?.gender ?? 'female') as 'female' | 'male',
        nickname: userRow?.nickname ?? '',
        birthdate: userRow?.birthdate ?? '',
        location: userRow?.location ?? '',
        bio: userRow?.bio ?? '',
        desiredGender: ((userRow?.seeking_gender ?? userRow?.desired_gender ?? 'both') as 'male' | 'female' | 'both'),
        workplaceType:
          (femaleRow?.workplace_type as 'hospital' | 'clinic' | 'beauty' | 'nightshift' | 'care_facility' | 'home_visit' | 'other') ?? 'hospital',
        hasNightShift: femaleRow?.has_night_shift ?? false,
        job: maleRow?.job ?? '',
        income: maleRow?.income ?? '',
        maritalStatus: (maleRow?.marital_status ?? 'single') as 'single' | 'married' | 'divorced' | 'partner',
        height: String(maleRow?.height ?? 170),
        smoking: maleRow?.smoking ?? '',
        drinking: maleRow?.drinking ?? '',
        nightShiftUnderstanding: maleRow?.night_shift_understanding ?? false,
        shiftWorkUnderstanding: maleRow?.shift_work_understanding ?? false,
      }}
    />
  );
}
