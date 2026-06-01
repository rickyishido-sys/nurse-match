'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  blockUser,
  unblockUser,
  createReport,
  createInterestSignal,
  getCurrentUser,
  respondToIncomingLike,
  markMatchAsRelationshipMode,
  saveProfile,
  saveProfileImages,
  sendMessage,
  swipe,
  toggleFavoriteCandidate,
  runRiskCheckForUser,
  updateRiskCheckDetails,
  updateMatchHoldDeletion,
  updateMaleReview,
  updateNurseVerification,
  updateReport,
  updateSuspended,
  updateUserModerationState,
  updateVerification,
} from '@/lib/data';
import { USE_MOCK_DATA } from '@/lib/config';
import {
  getUserByEmail,
  listProfileImages,
  setMaleReviewStatus,
  setNurseVerificationStatus,
  updateUser,
} from '@/lib/mock-data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uploadDocument } from '@/lib/upload';
import { normalizeMaleJob } from '@/lib/male-job-options';
import type { MaritalStatus, ModerationAction, ReportReasonType, ReportStatus } from '@/lib/types/domain';
import type { Database } from '@/lib/types/database';
import { sendReviewApprovedEmail, sendReviewRejectedEmail } from '@/lib/review-email';

function resolvePostLoginPath(user: {
  role: 'user' | 'female_admin' | 'male_admin' | 'super_admin';
  onboardingStatus: 'provisional' | 'profile_completed' | 'verified';
}) {
  if (user.role === 'female_admin') return '/admin/female';
  if (user.role === 'male_admin') return '/admin/male';
  if (user.role === 'super_admin') return '/admin';
  if (user.onboardingStatus === 'provisional') return '/preview';
  if (user.onboardingStatus === 'profile_completed') return '/pending-review';
  return '/home';
}

function isAdminRole(role: string | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

const E2E_TEST_FEMALE_EMAIL = 'test-female@nursematch.app';
const E2E_TEST_MALE_EMAIL = 'test-male@nursematch.app';

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isConfiguredAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  return parseAdminEmails().includes(email.trim().toLowerCase());
}

async function bootstrapTestUserIfNeeded(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  authUser: { id: string; email?: string | null },
) {
  const normalizedEmail = (authUser.email ?? '').trim().toLowerCase();
  const isFemaleTest = normalizedEmail === E2E_TEST_FEMALE_EMAIL;
  const isMaleTest = normalizedEmail === E2E_TEST_MALE_EMAIL;
  if (!isFemaleTest && !isMaleTest) return;

  const birthdate = isFemaleTest ? '1995-05-01' : '1993-07-01';
  const age = isFemaleTest ? 31 : 33;
  const gender = isFemaleTest ? 'female' : 'male';
  const nickname = isFemaleTest ? 'テスト女性' : 'テスト男性';

  await supabase.from('users').insert({
    id: authUser.id,
    email: normalizedEmail,
    role: 'user',
    gender,
    nickname,
    birthdate,
    age,
    location: 'Tokyo',
    bio: '',
    profile_image_url: '',
    desired_gender: isFemaleTest ? 'male' : 'female',
    seeking_gender: isFemaleTest ? 'male' : 'female',
    onboarding_status: 'verified',
    risk_check_status: 'clear',
    verification_status: 'approved',
    moderation_action: 'none',
    is_suspended: false,
    is_test_user: true,
  });

  if (isFemaleTest) {
    await supabase.from('female_profiles').upsert(
      {
        user_id: authUser.id,
        nurse_document_url: '',
        nurse_verification_status: 'approved',
        workplace_type: 'hospital',
        has_night_shift: true,
      },
      { onConflict: 'user_id' },
    );
  } else {
    await supabase.from('male_profiles').upsert(
      {
        user_id: authUser.id,
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
}

async function bootstrapAdminUserIfNeeded(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  authUser: { id: string; email?: string | null },
) {
  const normalizedEmail = (authUser.email ?? '').trim().toLowerCase();
  if (!isConfiguredAdminEmail(normalizedEmail)) return;

  await supabase.from('users').insert({
    id: authUser.id,
    email: normalizedEmail,
    role: 'super_admin',
    gender: 'male',
    nickname: 'Admin',
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
  });
}

export async function setDemoUserAction(formData: FormData) {
  if (!USE_MOCK_DATA) return;

  const userId = String(formData.get('userId') ?? 'u_f_1');
  const cookieStore = await cookies();
  cookieStore.set('demo_user_id', userId);
  revalidatePath('/');
}

export async function setFemaleSearchPreferenceAction(formData: FormData) {
  const payload = {
    view: String(formData.get('view') ?? 'card'),
    ageMin: String(formData.get('ageMin') ?? ''),
    ageMax: String(formData.get('ageMax') ?? ''),
    location: String(formData.get('location') ?? ''),
    job: String(formData.get('job') ?? ''),
    incomeMin: String(formData.get('incomeMin') ?? ''),
    maritalFilter: String(formData.get('maritalFilter') ?? 'single_only'),
    verifiedOnly: formData.get('verifiedOnly') ? 'on' : undefined,
    maleReviewedOnly: formData.get('maleReviewedOnly') ? 'on' : undefined,
    incomeVerifiedOnly: formData.get('incomeVerifiedOnly') ? 'on' : undefined,
    facePhotoOnly: formData.get('facePhotoOnly') ? 'on' : undefined,
    smoking: String(formData.get('smoking') ?? ''),
    drinking: String(formData.get('drinking') ?? ''),
    heightMin: String(formData.get('heightMin') ?? ''),
  };

  const cookieStore = await cookies();
  cookieStore.set('female_search_filters', JSON.stringify(payload), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/home/female');
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (USE_MOCK_DATA) {
    const user = getUserByEmail(email);
    if (!user) throw new Error('ユーザーが見つかりません');
    const cookieStore = await cookies();
    cookieStore.set('demo_user_id', user.id);
    redirect(resolvePostLoginPath(user));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error('Supabase設定が不足しています');

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  console.log('LOGIN_SIGNIN_RESULT', {
    email,
    hasSession: Boolean(signInData.session),
    hasUser: Boolean(signInData.user),
  });

  const authUser =
    signInData.user ??
    (await supabase.auth.getUser()).data.user ??
    null;
  if (!authUser) {
    console.log('LOGIN_AUTH_USER_MISSING', { email });
    redirect('/login?error=session-missing');
  }

  const { data: meRow, error: meError } = await supabase
    .from('users')
    .select('id,role,gender,onboarding_status,verification_status')
    .eq('id', authUser.id)
    .maybeSingle();
  let effectiveMeRow = meRow;
  if (!effectiveMeRow) {
    await bootstrapTestUserIfNeeded(supabase, authUser);
    const { data: retriedMeRow } = await supabase
      .from('users')
      .select('id,role,gender,onboarding_status,verification_status')
      .eq('id', authUser.id)
      .maybeSingle();
    effectiveMeRow = retriedMeRow ?? null;
  }
  if (meError || !effectiveMeRow) {
    console.log('LOGIN_USER_ROW_MISSING', {
      email,
      userId: authUser.id,
      error: meError?.message ?? null,
    });
    redirect('/login?error=user-row-missing');
  }

  const me = {
    id: effectiveMeRow.id,
    role: effectiveMeRow.role,
    gender: effectiveMeRow.gender,
    onboardingStatus: effectiveMeRow.onboarding_status,
    verificationStatus: effectiveMeRow.verification_status,
  };

  if (isAdminRole(me.role)) {
    await supabase.auth.signOut();
    redirect('/admin/login?error=use-admin-login');
  }

  if (me.role === 'user') {
    if (me.verificationStatus === 'rejected') redirect('/review-rejected');
    if (me.verificationStatus !== 'approved' || me.onboardingStatus !== 'verified') redirect('/pending-review');

    if (me.gender === 'female') {
      const { data: femaleProfile } = await supabase
        .from('female_profiles')
        .select('nurse_verification_status')
        .eq('user_id', me.id)
        .maybeSingle();
      if (!femaleProfile || femaleProfile.nurse_verification_status === 'rejected') redirect('/review-rejected');
      if (femaleProfile.nurse_verification_status !== 'approved') redirect('/pending-review');
    }
    if (me.gender === 'male') {
      const { data: maleProfile } = await supabase
        .from('male_profiles')
        .select('male_review_status')
        .eq('user_id', me.id)
        .maybeSingle();
      if (!maleProfile || maleProfile.male_review_status === 'rejected') redirect('/review-rejected');
      if (maleProfile.male_review_status !== 'approved') redirect('/pending-review');
    }
  }

  redirect(resolvePostLoginPath(me));
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (USE_MOCK_DATA) {
    const user = getUserByEmail(email);
    if (!user || !isAdminRole(user.role)) throw new Error('管理者アカウントが見つかりません');
    const cookieStore = await cookies();
    cookieStore.set('demo_user_id', user.id);
    redirect('/admin');
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error('Supabase設定が不足しています');

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const authUser = signInData.user ?? (await supabase.auth.getUser()).data.user ?? null;
  if (!authUser) redirect('/admin/login?error=session-missing');

  const { data: meRow, error: meError } = await supabase
    .from('users')
    .select('id,role')
    .eq('id', authUser.id)
    .maybeSingle();
  let effectiveMeRow = meRow;
  if (!effectiveMeRow) {
    await bootstrapAdminUserIfNeeded(supabase, authUser);
    const { data: retriedMeRow } = await supabase
      .from('users')
      .select('id,role')
      .eq('id', authUser.id)
      .maybeSingle();
    effectiveMeRow = retriedMeRow ?? null;
  }
  if (meError || !effectiveMeRow) {
    await supabase.auth.signOut();
    redirect('/admin/login?error=user-row-missing');
  }
  if (!isAdminRole(effectiveMeRow.role)) {
    await supabase.auth.signOut();
    redirect('/admin/login?error=forbidden');
  }

  redirect('/admin');
}

function resolveRequestOrigin(hostname: string | null, proto: string | null) {
  if (!hostname) return null;
  const scheme = proto === 'http' || proto === 'https' ? proto : 'https';
  return `${scheme}://${hostname}`;
}

function resolvePublicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  const normalized = raw.replace(/\/+$/, '');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return `https://${normalized}`;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createBurstAliasEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [localPart, domainPart] = normalized.split('@');
  if (!localPart || !domainPart) return normalized;
  if (localPart.includes('+')) return normalized;
  if (domainPart !== 'gmail.com' && domainPart !== 'googlemail.com') return normalized;
  const suffix = `nm${Date.now()}`;
  return `${localPart}+${suffix}@${domainPart}`;
}

function normalizePhone(value: string) {
  return value.trim().replace(/[^\d+]/g, '');
}

function redirectDuplicateError() {
  redirect('/register?error=duplicate-email');
}

function isSupabaseDuplicateError(message: string | undefined | null) {
  const text = (message ?? '').toLowerCase();
  return text.includes('already') || text.includes('duplicate') || text.includes('unique');
}

function calculateAgeFromBirthdate(birthdate: string) {
  const birthday = new Date(birthdate);
  if (Number.isNaN(birthday.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age -= 1;
  }
  return age;
}

export async function requestRegisterVerificationAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const allowBurst = String(formData.get('allowBurst') ?? '') === '1';
  const sendEmail = allowBurst ? createBurstAliasEmail(email) : email;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  console.log('REGISTER_START', {
    email,
    sendEmail,
    allowBurst,
    useMock,
  });

  if (!email) {
    redirect('/register?error=email-required');
  }

  if (useMock) {
    console.warn('[requestRegisterVerificationAction] USE_MOCK_DATA=true, OTP send is skipped', {
      email,
      useMock,
    });
    if (email && getUserByEmail(email)) {
      redirectDuplicateError();
    }
    redirect(`/register?sent=1${allowBurst ? '&burst=1' : ''}${sendEmail ? `&sentEmail=${encodeURIComponent(sendEmail)}` : ''}`);
  }

  console.log('SUPABASE_ENV', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  console.log('REGISTER_CONFIG_CHECK', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    useMock: process.env.NEXT_PUBLIC_USE_MOCK,
  });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl) {
    redirect('/register?error=config&detail=missing_url');
  }
  if (!supabaseAnonKey) {
    redirect('/register?error=config&detail=missing_anon_key');
  }

  // Use a stateless client for OTP request to avoid PKCE cookie verifier mismatch
  // when users open email links in different browser contexts.
  const otpClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    console.warn('[requestRegisterVerificationAction] admin client unavailable. duplicate checks are skipped.', {
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }

  if (email && adminSupabase) {
    const { data: existingEmail } = await adminSupabase.from('users').select('id').ilike('email', email).limit(1).maybeSingle();
    if (existingEmail) {
      redirectDuplicateError();
    }
  }

  const headerStore = await headers();
  const requestOrigin = resolveRequestOrigin(
    headerStore.get('x-forwarded-host') ?? headerStore.get('host'),
    headerStore.get('x-forwarded-proto'),
  );
  const siteUrl = resolvePublicSiteUrl();
  const redirectBase = siteUrl ?? requestOrigin;
  const emailRedirectTo = redirectBase ? `${redirectBase}/auth/callback?next=/register/details` : undefined;

  if (!siteUrl) {
    console.warn('[requestRegisterVerificationAction] NEXT_PUBLIC_SITE_URL is not set. Falling back to request origin.', {
      requestOrigin,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });
  }

  let redirectPath = '/register?sent=1';
  try {
    console.log('OTP_REQUEST', {
      email: sendEmail,
      redirectTo: emailRedirectTo,
    });
    const { data, error } = await otpClient.auth.signInWithOtp({
      email: sendEmail,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        shouldCreateUser: true,
      },
    });

    console.log('OTP_RESPONSE', {
      email: sendEmail,
      data,
      error,
    });

    if (error) {
      const detail = encodeURIComponent(error.message ?? 'unknown_error');
      redirectPath = `/register?error=supabase&detail=${detail}${allowBurst ? '&burst=1' : ''}`;
    } else {
      redirectPath = `/register?sent=1${allowBurst ? '&burst=1' : ''}${sendEmail ? `&sentEmail=${encodeURIComponent(sendEmail)}` : ''}`;
    }
  } catch (err) {
    if (String(err).includes('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('OTP_EXCEPTION', err);
    redirectPath = '/register?error=supabase&detail=unexpected';
  }

  redirect(redirectPath);
}

export async function logoutAction() {
  if (USE_MOCK_DATA) {
    const cookieStore = await cookies();
    cookieStore.delete('demo_user_id');
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}

export async function registerAction(formData: FormData) {
  const gender = String(formData.get('gender') ?? 'female') as 'female' | 'male';
  const birthdate = String(formData.get('birthdate') ?? '2000-01-01');
  const age = Number(formData.get('age') ?? 0);

  if (age < 18) throw new Error('未成年は登録できません');

  const payload = {
    nickname: String(formData.get('nickname') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
    desiredGender: String(formData.get('desiredGender') ?? 'both') as 'male' | 'female' | 'both',
    email: normalizeEmail(String(formData.get('email') ?? '')),
    password: String(formData.get('password') ?? '').trim(),
    job: normalizeMaleJob(String(formData.get('job') ?? '').trim()),
    income: String(formData.get('income') ?? '').trim(),
    maritalStatus: String(formData.get('maritalStatus') ?? 'single') as MaritalStatus,
  };

  if (!payload.nickname || !payload.email || !payload.password) {
    throw new Error('必須項目が不足しています');
  }
  const seekingGender = gender === 'male' ? 'female' : payload.desiredGender;

  if (USE_MOCK_DATA) {
    if (getUserByEmail(payload.email)) {
      redirectDuplicateError();
    }
    const userId = String(formData.get('userId') ?? 'u_f_1');
    const identityFile = formData.get('identityDocument') as File | null;
    const identityUrl = identityFile && identityFile.size > 0 ? await uploadDocument(identityFile, userId, 'identity') : null;
    const profileImageUrl = await uploadDocument(formData.get('profileImage') as File, userId, 'profile');

    updateUser(userId, {
      nickname: payload.nickname,
      birthdate,
      age,
      gender,
      location: payload.location,
      bio: payload.bio,
      desiredGender: seekingGender,
      onboardingStatus: 'provisional',
      riskCheckStatus: 'not_checked',
      verificationStatus: 'pending',
      identityDocumentUrl: identityUrl,
      profileImageUrl: profileImageUrl ?? undefined,
    });

    await saveProfile(userId, {
      nickname: payload.nickname,
      location: payload.location,
      bio: payload.bio,
      desiredGender: seekingGender,
      workplaceType: String(formData.get('workplaceType') ?? 'other'),
      hasNightShift: formData.get('hasNightShift') ? 'on' : 'off',
      nurseDocumentUrl: (await uploadDocument(formData.get('nurseDocument') as File, userId, 'nurse')) ?? '',
      job: payload.job,
      income: payload.income,
      maritalStatus: payload.maritalStatus,
      height: String(formData.get('height') ?? '170'),
      bodyType: String(formData.get('bodyType') ?? '普通'),
      holiday: String(formData.get('holiday') ?? ''),
      smoking: String(formData.get('smoking') ?? ''),
      drinking: String(formData.get('drinking') ?? ''),
      profileImageUrl: profileImageUrl ?? '',
    });

    revalidatePath('/preview');
    redirect('/preview');
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  if (!supabase || !adminSupabase) throw new Error('Supabase設定が不足しています');

  const { data: existingEmail } = await adminSupabase.from('users').select('id').ilike('email', payload.email).limit(1).maybeSingle();
  if (existingEmail) {
    redirectDuplicateError();
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });
  if (signUpError) {
    if (isSupabaseDuplicateError(signUpError.message)) {
      redirectDuplicateError();
    }
    throw new Error(signUpError.message);
  }

  const authUserId = signUpData.user?.id;
  if (!authUserId) throw new Error('ユーザー作成に失敗しました');

  const identityFile = formData.get('identityDocument') as File | null;
  const nurseFile = formData.get('nurseDocument') as File | null;
  const profileImageFile = formData.get('profileImage') as File | null;
  const identityUrl = identityFile && identityFile.size > 0 ? await uploadDocument(identityFile, authUserId, 'identity') : null;
  const nurseUrl = nurseFile && nurseFile.size > 0 ? await uploadDocument(nurseFile, authUserId, 'nurse') : null;
  const profileImageUrl = profileImageFile && profileImageFile.size > 0 ? await uploadDocument(profileImageFile, authUserId, 'profile') : null;

  const userInsert: Database['public']['Tables']['users']['Insert'] = {
    id: authUserId,
    email: payload.email,
    role: 'user',
    gender,
    nickname: payload.nickname,
    birthdate,
    age,
    location: payload.location,
    bio: payload.bio,
    profile_image_url: profileImageUrl ?? '',
    desired_gender: payload.desiredGender,
    seeking_gender: seekingGender,
    onboarding_status: 'provisional',
    risk_check_status: 'not_checked',
    verification_status: 'pending',
    identity_document_url: identityUrl,
    rejected_reason: null,
    moderation_action: 'none',
    is_suspended: false,
  };

  const { error: usersInsertErr } = await adminSupabase.from('users').insert(userInsert);
  if (usersInsertErr) throw new Error(usersInsertErr.message);

  const identityInsert: Database['public']['Tables']['identity_documents']['Insert'] = {
    user_id: authUserId,
    document_url: identityUrl ?? '',
    status: 'pending',
  };
  await adminSupabase.from('identity_documents').insert(identityInsert);

  if (gender === 'female') {
    const femaleInsert: Database['public']['Tables']['female_profiles']['Insert'] = {
      user_id: authUserId,
      nurse_document_url: nurseUrl ?? '',
      nurse_verification_status: 'pending',
      workplace_type: String(formData.get('workplaceType') ?? 'other') as
        | 'hospital'
        | 'clinic'
        | 'beauty'
        | 'nightshift'
        | 'care_facility'
        | 'home_visit'
        | 'other',
      has_night_shift: Boolean(formData.get('hasNightShift')),
    };
    const { error } = await adminSupabase.from('female_profiles').insert(femaleInsert);
    if (error) throw new Error(error.message);
  } else {
    const maleInsert: Database['public']['Tables']['male_profiles']['Insert'] = {
      user_id: authUserId,
      job: payload.job,
      income: payload.income,
      marital_status: payload.maritalStatus,
      has_children: false,
      male_review_status: 'pending',
      income_verified: false,
      face_photo_verified: false,
      internal_memo: null,
      height: Number(formData.get('height') ?? 170),
      body_type: String(formData.get('bodyType') ?? ''),
      holiday: String(formData.get('holiday') ?? ''),
      smoking: String(formData.get('smoking') ?? ''),
      drinking: String(formData.get('drinking') ?? ''),
      night_shift_understanding: false,
      shift_work_understanding: false,
      late_night_contact_ok: false,
      first_date_cost: '',
      personality_tags: [],
    };
    const { error } = await adminSupabase.from('male_profiles').insert(maleInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/preview');
  redirect('/preview');
}

export async function registerDetailsAction(formData: FormData) {
  const gender = String(formData.get('gender') ?? 'female') as 'female' | 'male';
  const password = String(formData.get('password') ?? '').trim();
  const passwordConfirm = String(formData.get('passwordConfirm') ?? '').trim();
  const nickname = String(formData.get('nickname') ?? '').trim();
  const birthdate = String(formData.get('birthdate') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const requestedDesiredGender = String(formData.get('desiredGender') ?? 'both') as 'male' | 'female' | 'both';
  const desiredGender = gender === 'male' ? 'female' : requestedDesiredGender;
  const seekingGender = desiredGender;
  const age = calculateAgeFromBirthdate(birthdate);
  const agreeTerms = Boolean(formData.get('agreeTerms'));
  const agreePrivacy = Boolean(formData.get('agreePrivacy'));
  const profileImageFile = formData.get('profileImage') as File | null;
  const identityFile = formData.get('identityDocument') as File | null;
  const nurseFile = formData.get('nurseDocument') as File | null;

  if (!nickname || !birthdate || !location || age < 18) {
    redirect('/register/details?error=required');
  }
  if (!password) {
    redirect('/register/details?error=password-required');
  }
  if (password.length < 8) {
    redirect('/register/details?error=password-length');
  }
  if (password !== passwordConfirm) {
    redirect('/register/details?error=password-mismatch');
  }
  if (!agreeTerms || !agreePrivacy) {
    redirect('/register/details?error=terms-required');
  }
  if (!profileImageFile || profileImageFile.size <= 0) {
    redirect('/register/details?error=profile-image-required');
  }
  if (!identityFile || identityFile.size <= 0) {
    redirect('/register/details?error=identity-required');
  }
  if (gender === 'female' && (!nurseFile || nurseFile.size <= 0)) {
    redirect('/register/details?error=nurse-document-required');
  }

  if (USE_MOCK_DATA) {
    const me = await getCurrentUser();
    if (!me) redirect('/register');
    if (me.role !== 'user') redirect('/register');
    const isTestUser = me.isTestUser === true;
    const profileImage = await uploadDocument(profileImageFile, me.id, 'profile');
    const identityUrl = await uploadDocument(identityFile, me.id, 'identity');
    const nurseUrl = nurseFile && nurseFile.size > 0 ? await uploadDocument(nurseFile, me.id, 'nurse') : null;
    const currentImages = listProfileImages(me.id);
    const uploadedImages = [profileImage].filter(Boolean) as string[];
    const hasAtLeastOneImage = uploadedImages.length > 0 || currentImages.length > 0;
    if (!isTestUser && !hasAtLeastOneImage) {
      redirect('/register/details?error=profile-image-required');
    }

    if (uploadedImages.length > 0) {
      await saveProfileImages(me.id, uploadedImages);
    }

    await saveProfile(me.id, {
      nickname,
      location,
      bio: '',
      desiredGender: seekingGender,
      workplaceType: 'hospital',
      hasNightShift: 'off',
      job: '',
      income: '',
      maritalStatus: 'single',
      height: '170',
      smoking: '',
      drinking: '',
      nightShiftUnderstanding: 'off',
      shiftWorkUnderstanding: 'off',
      profileImageUrl: uploadedImages[0] ?? me.profileImageUrl,
      nurseDocumentUrl: nurseUrl ?? '',
    });
    if (isTestUser) {
      if (gender === 'female') setNurseVerificationStatus(me.id, 'approved');
      if (gender === 'male') setMaleReviewStatus(me.id, 'approved');
    }

    updateUser(me.id, {
      gender,
      birthdate,
      age,
      onboardingStatus: isTestUser ? 'verified' : 'profile_completed',
      verificationStatus: isTestUser ? 'approved' : 'pending',
      identityDocumentUrl: identityUrl ?? null,
    });

    if (isTestUser) {
      redirect(gender === 'female' ? '/home/female' : '/home/male');
    }
    redirect('/pending-review');
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  if (!supabase || !adminSupabase) redirect('/register');

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) redirect('/register');
  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      console.error('REGISTER_DETAILS_PASSWORD_UPDATE_ERROR', passwordError);
      redirect('/register/details?error=password-update-failed');
    }
  }

  const userId = authUser.id;
  const profileImage = await uploadDocument(profileImageFile, userId, 'profile');
  const identityUrl = await uploadDocument(identityFile, userId, 'identity');
  const nurseUrl = nurseFile && nurseFile.size > 0 ? await uploadDocument(nurseFile, userId, 'nurse') : null;
  const uploadedImages = [profileImage].filter(Boolean) as string[];

  const { data: existingUser } = await adminSupabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (existingUser && existingUser.role !== 'user') {
    redirect('/register');
  }
  const isTestUser = existingUser?.is_test_user === true;

  const primaryImage = uploadedImages[0] ?? existingUser?.profile_image_url ?? '';
  const { error: userUpsertError } = await adminSupabase.from('users').upsert(
    {
      id: userId,
      email: normalizeEmail(authUser.email ?? existingUser?.email ?? ''),
      phone: authUser.phone ? normalizePhone(authUser.phone) : (existingUser?.phone ?? null),
      role: 'user',
      gender,
      nickname,
      birthdate,
      age,
      location,
      bio: '',
      profile_image_url: primaryImage,
      desired_gender: desiredGender,
      seeking_gender: seekingGender,
      onboarding_status: isTestUser ? 'verified' : 'profile_completed',
      risk_check_status: existingUser?.risk_check_status ?? 'not_checked',
      verification_status: isTestUser ? 'approved' : (existingUser?.verification_status ?? 'pending'),
      identity_document_url: identityUrl ?? existingUser?.identity_document_url ?? null,
      rejected_reason: existingUser?.rejected_reason ?? null,
      moderation_action: existingUser?.moderation_action ?? 'none',
      is_suspended: existingUser?.is_suspended ?? false,
      is_test_user: existingUser?.is_test_user ?? false,
    },
    { onConflict: 'id' },
  );
  if (userUpsertError) redirect('/register/details?error=save-failed');

  if (uploadedImages.length > 0) {
    await saveProfileImages(userId, uploadedImages);
  }

  if (gender === 'female') {
    const nurseStatus = isTestUser ? 'approved' : 'pending';
    await adminSupabase.from('female_profiles').upsert(
      {
        user_id: userId,
        nurse_document_url: nurseUrl ?? '',
        nurse_verification_status: nurseStatus,
        workplace_type: 'hospital',
        has_night_shift: false,
      },
      { onConflict: 'user_id' },
    );
    const { data: existingIdentity } = await adminSupabase.from('identity_documents').select('id').eq('user_id', userId).maybeSingle();
    if (existingIdentity?.id) {
      await adminSupabase
        .from('identity_documents')
        .update({ document_url: identityUrl ?? '', status: isTestUser ? 'approved' : 'pending' })
        .eq('id', existingIdentity.id);
    } else {
      await adminSupabase.from('identity_documents').insert({
        user_id: userId,
        document_url: identityUrl ?? '',
        status: isTestUser ? 'approved' : 'pending',
      });
    }
    if (isTestUser) {
      redirect('/home/female');
    }
    redirect('/pending-review');
  }

  const maleStatus = isTestUser ? 'approved' : 'pending';
  await adminSupabase.from('male_profiles').upsert(
    {
      user_id: userId,
      job: '',
      income: '',
      marital_status: 'single',
      has_children: false,
      male_review_status: maleStatus,
      income_verified: false,
      face_photo_verified: false,
      internal_memo: null,
      height: 170,
      body_type: '',
      holiday: '',
      smoking: '',
      drinking: '',
      night_shift_understanding: false,
      shift_work_understanding: false,
      late_night_contact_ok: false,
      first_date_cost: '',
      personality_tags: [],
    },
    { onConflict: 'user_id' },
  );
  const { data: existingIdentity } = await adminSupabase.from('identity_documents').select('id').eq('user_id', userId).maybeSingle();
  if (existingIdentity?.id) {
    await adminSupabase
      .from('identity_documents')
      .update({ document_url: identityUrl ?? '', status: isTestUser ? 'approved' : 'pending' })
      .eq('id', existingIdentity.id);
  } else {
    await adminSupabase.from('identity_documents').insert({
      user_id: userId,
      document_url: identityUrl ?? '',
      status: isTestUser ? 'approved' : 'pending',
    });
  }
  if (isTestUser) {
    redirect('/home/male');
  }
  redirect('/pending-review');
}

export async function swipeAction(formData: FormData) {
  const fromUserId = String(formData.get('fromUserId'));
  const toUserId = String(formData.get('toUserId'));
  const action = String(formData.get('action')) as 'like' | 'skip';

  const result = await swipe(fromUserId, toUserId, action);
  revalidatePath('/home/female');
  revalidatePath('/discover');
  revalidatePath('/likes');
  revalidatePath('/matches');
  revalidatePath('/activity');
  revalidatePath('/chats');
  return result;
}

export async function swipeSubmitAction(formData: FormData) {
  await swipeAction(formData);
}

export async function respondToIncomingLikeAction(formData: FormData) {
  const fromUserId = String(formData.get('fromUserId'));
  const toUserId = String(formData.get('toUserId'));
  const action = String(formData.get('action')) as 'like' | 'skip';
  const result = await respondToIncomingLike(fromUserId, toUserId, action);
  revalidatePath('/likes');
  revalidatePath('/matches');
  revalidatePath('/chats');
  revalidatePath('/activity');
  return result;
}

export async function respondToIncomingLikeSubmitAction(formData: FormData) {
  await respondToIncomingLikeAction(formData);
}

export async function toggleFavoriteAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const targetUserId = String(formData.get('targetUserId'));
  await toggleFavoriteCandidate(userId, targetUserId);
  revalidatePath('/preview');
  revalidatePath('/favorites');
}

export async function favoriteLikeAction(formData: FormData) {
  const fromUserId = String(formData.get('fromUserId'));
  const toUserId = String(formData.get('toUserId'));
  await swipe(fromUserId, toUserId, 'like');
  revalidatePath('/favorites');
  revalidatePath('/home/female');
  revalidatePath('/matches');
}

export async function maleInterestSignalAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const targetUserId = String(formData.get('targetUserId'));
  const signalType = String(formData.get('signalType')) as 'interested' | 'skipped';
  await createInterestSignal({ userId, targetUserId, signalType });
  revalidatePath('/home/male');
  revalidatePath('/home/female');
  revalidatePath('/preview');
}

export async function sendMessageAction(formData: FormData) {
  const matchId = String(formData.get('matchId'));
  const senderId = String(formData.get('senderId'));
  const body = String(formData.get('body'));
  if (!body.trim()) return;

  await sendMessage(matchId, senderId, body.trim());
  revalidatePath(`/chat/${matchId}`);
  revalidatePath(`/chats/${matchId}`);
  revalidatePath(`/messages/${matchId}`);
  revalidatePath('/matches');
  revalidatePath('/chats');
  revalidatePath('/activity');
}

export async function blockUserAction(formData: FormData) {
  const blockerUserId = String(formData.get('blockerUserId'));
  const blockedUserId = String(formData.get('blockedUserId'));
  await blockUser(blockerUserId, blockedUserId);

  revalidatePath('/blocked-users');
  revalidatePath('/home/female');
  revalidatePath('/matches');
  revalidatePath('/chats');
  revalidatePath('/chat');
  revalidatePath('/activity');
}

export async function markRelationshipModeAction(formData: FormData) {
  const matchId = String(formData.get('matchId'));
  const actorUserId = String(formData.get('actorUserId'));

  await markMatchAsRelationshipMode(matchId, actorUserId);
  revalidatePath('/matches');
  revalidatePath(`/chat/${matchId}`);
  revalidatePath('/chats');
  revalidatePath(`/chats/${matchId}`);
  revalidatePath('/home/female');
  revalidatePath('/activity');
}

export async function saveProfileAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const nurseDoc = await uploadDocument(formData.get('nurseDocument') as File, userId, 'nurse');
  const profileImage1 = await uploadDocument(formData.get('profileImage') as File, userId, 'profile');
  const profileImage2 = await uploadDocument(formData.get('profileImage2') as File, userId, 'profile');
  const profileImage3 = await uploadDocument(formData.get('profileImage3') as File, userId, 'profile');

  const payload = Object.fromEntries(formData.entries()) as Record<string, string>;
  const personalityTags = formData
    .getAll('personalityTag')
    .map((value) => String(value).trim())
    .filter(Boolean);
  payload.personalityTags = personalityTags.join(',');
  payload.nurseDocumentUrl = nurseDoc ?? '';
  payload.profileImageUrl = profileImage1 ?? '';
  await saveProfile(userId, payload);
  await saveProfileImages(userId, [profileImage1, profileImage2, profileImage3].filter(Boolean) as string[]);

  revalidatePath('/profile/edit');
  revalidatePath('/pending-review');
}

async function requireAdminForTarget(
  targetUserId: string,
  allowed: Array<'female_admin' | 'male_admin' | 'super_admin'>,
) {
  const admin = await getCurrentUser();
  if (!admin) return null;
  if (!allowed.includes(admin.role as 'female_admin' | 'male_admin' | 'super_admin')) return null;
  if (admin.role === 'super_admin') return admin;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: target } = await supabase.from('users').select('gender').eq('id', targetUserId).single();
  if (!target) return null;
  if (admin.role === 'female_admin' && target.gender !== 'female') return null;
  if (admin.role === 'male_admin' && target.gender !== 'male') return null;
  return admin;
}

export async function adminVerificationAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const status = String(formData.get('status')) as 'pending' | 'approved' | 'rejected';
  const rejectedReason = String(formData.get('rejectedReason') ?? '').trim();
  const admin = await requireAdminForTarget(userId, ['female_admin', 'male_admin', 'super_admin']);
  if (!admin) return;
  if (status === 'approved') {
    const risk = await runRiskCheckForUser(userId, admin.id);
    if (!risk || risk.status === 'review_required' || risk.status === 'rejected') {
      throw new Error('リスクチェックで要確認が検出されました。管理者が最終確認してください。');
    }
  }

  await updateVerification(userId, status, rejectedReason || undefined, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminNurseAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const status = String(formData.get('status')) as 'pending' | 'approved' | 'rejected';
  const admin = await requireAdminForTarget(userId, ['female_admin', 'super_admin']);
  if (!admin) return;

  await updateNurseVerification(userId, status, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
}

export async function adminMaleReviewAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const status = String(formData.get('status')) as 'pending' | 'approved' | 'rejected';
  const internalMemo = String(formData.get('internalMemo') ?? '').trim();
  const admin = await requireAdminForTarget(userId, ['male_admin', 'super_admin']);
  if (!admin) return;

  await updateMaleReview(userId, status, internalMemo, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/male');
}

export async function adminSuspendAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const suspend = String(formData.get('suspend')) === 'true';
  const admin = await requireAdminForTarget(userId, ['female_admin', 'male_admin', 'super_admin']);
  if (!admin) return;

  await updateSuspended(userId, suspend, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminModerationAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const moderationAction = String(formData.get('moderationAction')) as ModerationAction;
  const rejectedReason = String(formData.get('rejectedReason') ?? '').trim() || null;
  const admin = await requireAdminForTarget(userId, ['female_admin', 'male_admin', 'super_admin']);
  if (!admin) return;

  await updateUserModerationState(userId, moderationAction, rejectedReason, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminReportAction(formData: FormData) {
  const reportId = String(formData.get('reportId'));
  const status = String(formData.get('status')) as ReportStatus;
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== 'female_admin' && admin.role !== 'male_admin' && admin.role !== 'super_admin')) return;
  await updateReport(reportId, status);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminMatchHoldDeletionAction(formData: FormData) {
  const matchId = String(formData.get('matchId'));
  const holdDeletion = String(formData.get('holdDeletion')) === 'true';
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'super_admin') return;

  await updateMatchHoldDeletion(matchId, holdDeletion, admin.id);
  revalidatePath('/admin');
}

export async function adminRunRiskCheckAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== 'female_admin' && admin.role !== 'male_admin' && admin.role !== 'super_admin')) return;
  await runRiskCheckForUser(userId, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminRiskCheckUpdateAction(formData: FormData) {
  const userId = String(formData.get('userId'));
  const status = String(formData.get('status')) as 'clear' | 'review_required' | 'rejected';
  const adminMemo = String(formData.get('adminMemo') ?? '').trim();
  const admin = await requireAdminForTarget(userId, ['female_admin', 'male_admin', 'super_admin']);
  if (!admin) return;
  await updateRiskCheckDetails(userId, status, adminMemo, admin.id);
  revalidatePath('/admin');
  revalidatePath('/admin/female');
  revalidatePath('/admin/male');
}

export async function adminApproveReviewAction(formData: FormData) {
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const adminUser = await getCurrentUser();
  if (!adminUser || !isAdminRole(adminUser.role)) return;

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) throw new Error('Supabase admin client unavailable');

  const { data: target } = await adminSupabase
    .from('users')
    .select('id,email,gender')
    .eq('id', userId)
    .maybeSingle();
  if (!target) return;

  await adminSupabase
    .from('users')
    .update({
      verification_status: 'approved',
      onboarding_status: 'verified',
      rejected_reason: null,
    })
    .eq('id', userId);

  await adminSupabase
    .from('identity_documents')
    .update({ status: 'approved' })
    .eq('user_id', userId);

  if (target.gender === 'female') {
    await adminSupabase
      .from('female_profiles')
      .update({ nurse_verification_status: 'approved' })
      .eq('user_id', userId);
  } else {
    await adminSupabase
      .from('male_profiles')
      .update({ male_review_status: 'approved' })
      .eq('user_id', userId);
  }

  await sendReviewApprovedEmail(target.email);

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/pending-review');
}

export async function adminRejectReviewAction(formData: FormData) {
  const userId = String(formData.get('userId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!userId || !reason) return;

  const adminUser = await getCurrentUser();
  if (!adminUser || !isAdminRole(adminUser.role)) return;

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) throw new Error('Supabase admin client unavailable');

  const { data: target } = await adminSupabase
    .from('users')
    .select('id,email,gender')
    .eq('id', userId)
    .maybeSingle();
  if (!target) return;

  await adminSupabase
    .from('users')
    .update({
      verification_status: 'rejected',
      onboarding_status: 'profile_completed',
      rejected_reason: reason,
    })
    .eq('id', userId);

  await adminSupabase
    .from('identity_documents')
    .update({ status: 'rejected' })
    .eq('user_id', userId);

  if (target.gender === 'female') {
    await adminSupabase
      .from('female_profiles')
      .update({ nurse_verification_status: 'rejected' })
      .eq('user_id', userId);
  } else {
    await adminSupabase
      .from('male_profiles')
      .update({ male_review_status: 'rejected' })
      .eq('user_id', userId);
  }

  await sendReviewRejectedEmail(target.email, reason);

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/review-rejected');
}

export async function registerDatefiInterestAction() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  if (me.gender !== 'male') redirect('/mypage');
  if (me.verificationStatus !== 'approved' || me.onboardingStatus !== 'verified') redirect('/pending-review');

  const adminSupabase = createAdminSupabaseClient();
  if (adminSupabase) {
    await adminSupabase
      .from('datefi_interests')
      .upsert(
        {
          user_id: me.id,
          email: me.email,
          status: 'interested',
        },
        { onConflict: 'user_id' },
      );
  } else {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error('Supabase設定が不足しています');
    await supabase
      .from('datefi_interests')
      .upsert(
        {
          user_id: me.id,
          email: me.email,
          status: 'interested',
        },
        { onConflict: 'user_id' },
      );
  }

  redirect('/datefi?registered=1');
}

export async function createReportAction(formData: FormData) {
  const reporterId = String(formData.get('reporterId'));
  const targetUserId = String(formData.get('targetUserId'));
  const reason = String(formData.get('reason') ?? '通報');
  const reasonType = String(formData.get('reasonType') ?? 'other') as ReportReasonType;
  const detail = String(formData.get('detail') ?? '');

  await createReport({ reporterId, targetUserId, reason, reasonType, detail });
  revalidatePath('/admin');
  revalidatePath('/chat');
  revalidatePath('/chats');
  revalidatePath('/home/female');
  revalidatePath('/activity');
}

export async function unblockUserAction(formData: FormData) {
  const blockerUserId = String(formData.get('blockerUserId'));
  const blockedUserId = String(formData.get('blockedUserId'));
  await unblockUser(blockerUserId, blockedUserId);
  revalidatePath('/blocked-users');
  revalidatePath('/home/female');
  revalidatePath('/activity');
  revalidatePath('/chats');
}

export async function deleteAccountAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  const deleteReason = String(formData.get('deleteReason') ?? '').trim();
  const reasonText = deleteReason ? `退会理由: ${deleteReason}` : null;

  if (USE_MOCK_DATA) {
    updateUser(me.id, {
      isSuspended: true,
      moderationAction: 'permanent_ban',
      rejectedReason: reasonText,
      deletedAt: new Date().toISOString(),
    });
    const cookieStore = await cookies();
    cookieStore.delete('demo_user_id');
    redirect('/login?deleted=1');
  }

  const admin = createAdminSupabaseClient();
  const supabase = await createServerSupabaseClient();
  if (!admin || !supabase) redirect('/delete-account');

  await admin
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      is_suspended: true,
      moderation_action: 'permanent_ban',
      rejected_reason: reasonText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', me.id);
  await supabase.auth.signOut();
  redirect('/login?deleted=1');
}
