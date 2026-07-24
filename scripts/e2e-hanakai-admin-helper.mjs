/** Shared Preview E2E helpers for configured HANAKAI admin account. */

export async function ensureE2EAdminReady(adminClient, envVars) {
  const adminMemberId = envVars.HANAKAI_E2E_ADMIN_MEMBER_ID || process.env.HANAKAI_E2E_ADMIN_MEMBER_ID;
  const adminEmail = envVars.HANAKAI_E2E_ADMIN_EMAIL || process.env.HANAKAI_E2E_ADMIN_EMAIL;
  if (!adminMemberId && !adminEmail) return { ok: false, detail: 'admin env missing' };

  let authUserId = null;
  let memberId = adminMemberId || null;

  if (adminMemberId) {
    const { data: member } = await adminClient
      .from('hanakai_members')
      .select('auth_user_id')
      .eq('id', adminMemberId)
      .maybeSingle();
    authUserId = member?.auth_user_id ?? null;
  }

  if (!authUserId && adminEmail) {
    for (let page = 1; page <= 10; page += 1) {
      const { data } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
      const user = data.users.find((u) => u.email === adminEmail);
      if (user) {
        authUserId = user.id;
        break;
      }
      if (data.users.length < 200) break;
    }
    if (authUserId && !memberId) {
      const { data: member } = await adminClient
        .from('hanakai_members')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      memberId = member?.id ?? null;
    }
  }

  if (!authUserId) return { ok: false, detail: 'admin auth user not found' };

  const now = new Date().toISOString();
  const normalizedEmail = (adminEmail ?? '').trim().toLowerCase();
  const { error: userErr } = await adminClient.from('users').upsert(
    {
      id: authUserId,
      email: normalizedEmail || `e2e-admin-${authUserId.slice(0, 8)}@test.hanakai.local`,
      role: 'super_admin',
      gender: 'female',
      nickname: 'E2E運営',
      birthdate: '1990-01-01',
      age: 35,
      location: 'Tokyo',
      bio: '',
      profile_image_url: '',
      desired_gender: 'female',
      seeking_gender: 'female',
      onboarding_status: 'verified',
      risk_check_status: 'clear',
      verification_status: 'approved',
      moderation_action: 'none',
      is_suspended: false,
      is_test_user: true,
    },
    { onConflict: 'id' },
  );
  if (userErr) return { ok: false, detail: userErr.message };

  if (memberId) {
    await adminClient
      .from('hanakai_members')
      .update({
        nickname: 'E2E運営',
        gender: 'female',
        area: '東京',
        age: 30,
        age_band: '30代',
        terms_agreed_at: now,
        privacy_agreed_at: now,
        terms_version: '2026-07-16',
        privacy_version: '2026-07-08',
        identity_verified: true,
        document_upload_status: 'approved',
        trust_verification_status: 'verified',
      })
      .eq('id', memberId);
  }

  return { ok: true, authUserId, memberId };
}
