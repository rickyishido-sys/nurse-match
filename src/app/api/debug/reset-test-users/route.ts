import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEST_USERS = [
  { email: 'test-female@nursematch.app', gender: 'female' as const, nickname: 'テスト女性', birthdate: '1995-05-01', age: 31 },
  { email: 'test-male@nursematch.app', gender: 'male' as const, nickname: 'テスト男性', birthdate: '1993-07-01', age: 33 },
];
const TEST_PASSWORD = 'test1234';

function isAdminRole(role: string | null | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: 'missing_session_client' }, { status: 500 });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }
  const { data: me } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    return NextResponse.json({ ok: false, reason: 'forbidden' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ ok: false, reason: 'missing_service_role_client' }, { status: 500 });
  }

  const results: Record<string, { ok: boolean; userId: string | null; error: string | null }> = {};

  for (const testUser of TEST_USERS) {
    try {
      let userId: string | null = null;

      const { data: existingRow } = await admin.from('users').select('id').eq('email', testUser.email).maybeSingle();
      if (existingRow?.id) {
        userId = existingRow.id;
      } else {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: testUser.email,
          password: TEST_PASSWORD,
          email_confirm: true,
        });
        if (createError && !createError.message.toLowerCase().includes('already')) {
          results[testUser.email] = { ok: false, userId: null, error: createError.message };
          continue;
        }
        userId = created?.user?.id ?? null;
      }

      if (userId) {
        const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
          password: TEST_PASSWORD,
          email_confirm: true,
        });
        if (updateError) {
          results[testUser.email] = { ok: false, userId, error: updateError.message };
          continue;
        }
      }

      if (!userId) {
        results[testUser.email] = { ok: false, userId: null, error: 'user_id_unresolved' };
        continue;
      }

      await admin.from('users').upsert(
        {
          id: userId,
          email: testUser.email,
          role: 'user',
          gender: testUser.gender,
          nickname: testUser.nickname,
          birthdate: testUser.birthdate,
          age: testUser.age,
          location: 'Tokyo',
          bio: '',
          profile_image_url: '',
          desired_gender: testUser.gender === 'female' ? 'male' : 'female',
          seeking_gender: testUser.gender === 'female' ? 'male' : 'female',
          onboarding_status: 'verified',
          risk_check_status: 'clear',
          verification_status: 'approved',
          moderation_action: 'none',
          is_suspended: false,
          is_test_user: true,
        },
        { onConflict: 'id' },
      );

      if (testUser.gender === 'female') {
        await admin.from('female_profiles').upsert(
          {
            user_id: userId,
            nurse_document_url: '',
            nurse_verification_status: 'approved',
            workplace_type: 'hospital',
            has_night_shift: true,
          },
          { onConflict: 'user_id' },
        );
      } else {
        await admin.from('male_profiles').upsert(
          {
            user_id: userId,
            job: '会社員',
            income: '600-800',
            marital_status: 'single',
            has_children: false,
            male_review_status: 'approved',
            income_verified: true,
            face_photo_verified: true,
            night_shift_understanding: true,
            shift_work_understanding: true,
            late_night_contact_ok: true,
            personality_tags: ['誠実'],
          },
          { onConflict: 'user_id' },
        );
      }

      results[testUser.email] = { ok: true, userId, error: null };
    } catch (error) {
      results[testUser.email] = {
        ok: false,
        userId: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  console.log('DEBUG_RESET_TEST_USERS', results);
  return NextResponse.json({ ok: true, results });
}
