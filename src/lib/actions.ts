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
import { USE_MOCK_DATA, HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { ensureHanakaiMemberForAuthUser } from '@/lib/connection/identity';
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
  if (user.onboardingStatus === 'provisional') return '/onboarding-preview';
  if (user.onboardingStatus === 'profile_completed') return '/pending-review';
  return '/home';
}

function isAdminRole(role: string | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

function resolveAdminLoginRedirectPath(role: string | undefined) {
  if (role === 'female_admin') return '/admin/female';
  if (role === 'male_admin') return '/admin/male';
  return '/admin';
}

const E2E_TEST_FEMALE_EMAIL = 'test-female@nursematch.app';
const E2E_TEST_MALE_EMAIL = 'test-male@nursematch.app';

function getJstDateString(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

const E2E_TEST_USER_PASSWORD = 'test1234';

// Self-heal designated E2E test accounts whose auth password drifted
// (e.g. changed by a register-details smoke run). Enabled only while the
// dev OTP bypass flag is on, and only for the canonical test password.
async function tryHealTestUserPassword(email: string, password: string) {
  if (process.env.REGISTER_DEV_BYPASS_OTP !== 'true') return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== E2E_TEST_FEMALE_EMAIL && normalizedEmail !== E2E_TEST_MALE_EMAIL) return false;
  if (password !== E2E_TEST_USER_PASSWORD) return false;

  const admin = createAdminSupabaseClient();
  if (!admin) return false;

  const { data: row } = await admin.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
  if (row?.id) {
    const { error } = await admin.auth.admin.updateUserById(row.id, {
      password: E2E_TEST_USER_PASSWORD,
      email_confirm: true,
    });
    console.warn('LOGIN_TEST_USER_PASSWORD_HEALED', { email: normalizedEmail, userId: row.id, ok: !error, message: error?.message ?? null });
    return !error;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: E2E_TEST_USER_PASSWORD,
    email_confirm: true,
  });
  console.warn('LOGIN_TEST_USER_CREATED', {
    email: normalizedEmail,
    userId: created?.user?.id ?? null,
    ok: !createError,
    message: createError?.message ?? null,
  });
  return !createError;
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

  await supabase.from('users').upsert({
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
  }, { onConflict: 'id' });

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

  // Keep the E2E pair in a deterministic state so discover/likes flow can run.
  const admin = createAdminSupabaseClient();
  if (!admin) return;
  const { data: testRows } = await admin
    .from('users')
    .select('id,email')
    .in('email', [E2E_TEST_FEMALE_EMAIL, E2E_TEST_MALE_EMAIL]);
  const femaleId = (testRows ?? []).find((row) => row.email?.toLowerCase() === E2E_TEST_FEMALE_EMAIL)?.id;
  const maleId = (testRows ?? []).find((row) => row.email?.toLowerCase() === E2E_TEST_MALE_EMAIL)?.id;
  if (!femaleId || !maleId) return;

  await admin.from('likes').delete().eq('from_user_id', femaleId).eq('to_user_id', maleId);
  await admin.from('likes').delete().eq('from_user_id', maleId).eq('to_user_id', femaleId);
  await admin.from('swipes').delete().eq('from_user_id', femaleId).eq('to_user_id', maleId);
  await admin.from('swipes').delete().eq('from_user_id', maleId).eq('to_user_id', femaleId);
  await admin.from('matches').delete().or(`user_a_id.eq.${femaleId},user_b_id.eq.${femaleId}`);
  await admin.from('matches').delete().or(`user_a_id.eq.${maleId},user_b_id.eq.${maleId}`);

  const recommendationDate = getJstDateString();
  await admin.from('daily_recommendations').delete().eq('user_id', femaleId).eq('recommendation_date', recommendationDate);
  await admin.from('daily_recommendations').insert({
    user_id: femaleId,
    target_user_id: maleId,
    recommendation_date: recommendationDate,
    rank: 1,
    reason: 'E2Eテスト候補',
  });
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
  if (!supabase) {
    console.error('LOGIN_ERROR', { stage: 'supabase_client_missing', email });
    redirect('/login?error=config');
  }

  let signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (signInResult.error && (await tryHealTestUserPassword(email, password))) {
    signInResult = await supabase.auth.signInWithPassword({ email, password });
  }
  const { data: signInData, error } = signInResult;
  if (error) {
    console.error('LOGIN_ERROR', { stage: 'sign_in', email, message: error.message });
    redirect('/login?error=invalid-credentials');
  }

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
  await bootstrapTestUserIfNeeded(supabase, authUser);

  let effectiveMeRow = meRow;
  if (!effectiveMeRow) {
    const { data: retriedMeRow } = await supabase
      .from('users')
      .select('id,role,gender,onboarding_status,verification_status')
      .eq('id', authUser.id)
      .maybeSingle();
    effectiveMeRow = retriedMeRow ?? null;
  }
  if (meError || !effectiveMeRow) {
    if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
      const memberId = await ensureHanakaiMemberForAuthUser(authUser.id, {
        email: authUser.email,
        nickname: (authUser.user_metadata?.nickname as string | undefined) ?? null,
      });
      if (memberId) {
        console.log('LOGIN_CONNECTION_ONLY', { email, userId: authUser.id, memberId });
        redirect('/home');
      }
    }
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
  const safeAdminLoginRedirect = (errorCode: string, context: string, details?: unknown): never => {
    console.error('ADMIN_LOGIN_ERROR', {
      pathname: '/admin/login',
      queryName: context,
      tableName: null,
      context,
      errorCode,
      details,
    });
    const to = `/admin/login?error=${errorCode}`;
    console.log('ADMIN_LOGIN_REDIRECT_TO', { pathname: '/admin/login', redirectTo: to });
    redirect(to);
  };
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  console.log('ADMIN_LOGIN_START', { email });

  try {
    if (USE_MOCK_DATA) {
      const user = getUserByEmail(email);
      if (!user || !isAdminRole(user.role)) {
        safeAdminLoginRedirect('invalid-credentials', 'mock_admin_not_found');
      }
      const checkedUser = user!;
      const cookieStore = await cookies();
      cookieStore.set('demo_user_id', checkedUser.id);
      const redirectTo = resolveAdminLoginRedirectPath(checkedUser.role);
      console.log('ADMIN_LOGIN_ROLE', { role: checkedUser.role });
      console.log('ADMIN_LOGIN_REDIRECT_TO', { redirectTo });
      redirect(redirectTo);
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      safeAdminLoginRedirect('config-missing', 'missing_supabase_client');
    }
    const checkedSupabase = supabase!;

    const { data: signInData, error } = await checkedSupabase.auth.signInWithPassword({ email, password });
    if (error) {
      safeAdminLoginRedirect('invalid-credentials', 'signin_failed', error.message);
    }
    console.log('ADMIN_LOGIN_AUTH_SUCCESS', {
      email,
      userId: signInData.user?.id ?? null,
    });

    const authUser = signInData.user ?? (await checkedSupabase.auth.getUser()).data.user ?? null;
    if (!authUser) safeAdminLoginRedirect('session-missing', 'auth_user_missing_after_signin');
    const checkedAuthUser = authUser!;

    const { data: meRow, error: meError } = await checkedSupabase
      .from('users')
      .select('id,role')
      .eq('id', checkedAuthUser.id)
      .maybeSingle();
    console.log('ADMIN_LOGIN_USER_ROW', {
      userId: checkedAuthUser.id,
      found: Boolean(meRow),
      hasError: Boolean(meError),
      errorMessage: meError?.message ?? null,
    });
    let effectiveMeRow = meRow;
    if (!effectiveMeRow) {
      await bootstrapAdminUserIfNeeded(checkedSupabase, checkedAuthUser);
      const { data: retriedMeRow } = await checkedSupabase
        .from('users')
        .select('id,role')
        .eq('id', checkedAuthUser.id)
        .maybeSingle();
      effectiveMeRow = retriedMeRow ?? null;
    }
    if (meError || !effectiveMeRow) {
      await checkedSupabase.auth.signOut();
      safeAdminLoginRedirect('user-row-missing', 'admin_user_row_missing', meError?.message ?? null);
    }
    const checkedMeRow = effectiveMeRow!;
    if (!isAdminRole(checkedMeRow.role)) {
      // Self-heal: a configured admin email may have been demoted to 'user'
      // (e.g. by testing /register/details with the admin account).
      if (isConfiguredAdminEmail(email)) {
        const adminClient = createAdminSupabaseClient();
        if (adminClient) {
          const { error: restoreError } = await adminClient
            .from('users')
            .update({ role: 'super_admin', onboarding_status: 'verified', verification_status: 'approved' })
            .eq('id', checkedMeRow.id);
          if (!restoreError) {
            console.warn('ADMIN_LOGIN_ROLE_RESTORED', { userId: checkedMeRow.id, email, previousRole: checkedMeRow.role });
            const restoredRedirectTo = resolveAdminLoginRedirectPath('super_admin');
            console.log('ADMIN_LOGIN_REDIRECT_TO', { redirectTo: restoredRedirectTo });
            redirect(restoredRedirectTo);
          }
          console.error('ADMIN_LOGIN_ROLE_RESTORE_ERROR', { userId: checkedMeRow.id, message: restoreError.message });
        }
      }
      await checkedSupabase.auth.signOut();
      safeAdminLoginRedirect('forbidden', 'not_admin_role', checkedMeRow.role);
    }
    console.log('ADMIN_LOGIN_ROLE', { role: checkedMeRow.role });
    const redirectTo = resolveAdminLoginRedirectPath(checkedMeRow.role);
    console.log('ADMIN_LOGIN_REDIRECT_TO', { redirectTo });
    redirect(redirectTo);
  } catch (error) {
    const isRedirectError =
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest?: unknown }).digest === 'string' &&
      (error as { digest: string }).digest.startsWith('NEXT_REDIRECT');
    if (isRedirectError) throw error;
    console.error('ADMIN_LOGIN_EXCEPTION', {
      pathname: '/admin/login',
      queryName: 'admin_login_action',
      tableName: null,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    safeAdminLoginRedirect('unexpected', 'unhandled_exception', error instanceof Error ? error.message : String(error));
  }
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

function isRateLimitError(message: string | undefined | null, code: string | undefined | null) {
  const text = (message ?? '').toLowerCase();
  const normalizedCode = (code ?? '').toLowerCase();
  return (
    text.includes('rate limit') ||
    text.includes('too many') ||
    normalizedCode === 'over_email_send_rate_limit'
  );
}

function isInvalidApiKeyError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { message?: unknown; hint?: unknown };
  const message = String(maybe.message ?? '').toLowerCase();
  const hint = String(maybe.hint ?? '').toLowerCase();
  return message.includes('invalid api key') || hint.includes('anon') || hint.includes('service_role');
}

function generateOtpBypassPassword() {
  return `NmBypass!${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export async function requestRegisterVerificationAction(formData: FormData) {
  try {
    const email = normalizeEmail(String(formData.get('email') ?? ''));
    const allowBurst = String(formData.get('allowBurst') ?? '') === '1';
    const sendEmail = allowBurst ? createBurstAliasEmail(email) : email;
    const bypassOtpForDev = process.env.REGISTER_DEV_BYPASS_OTP === 'true';
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
    console.log('REGISTER_START', {
      email,
      sendEmail,
      allowBurst,
      bypassOtpForDev,
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
    const legacyFlow = String(formData.get('legacyFlow') ?? '') === '1';
    const postAuthPath = legacyFlow ? '/register/details' : '/register/profile';
    const emailRedirectTo = redirectBase
      ? `${redirectBase}/auth/callback?next=${encodeURIComponent(postAuthPath)}`
      : undefined;

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
        const errorCode =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : null;

        if (allowBurst && bypassOtpForDev && isRateLimitError(error.message, errorCode)) {
          console.warn('REGISTER_OTP_BYPASS_START', {
            email,
            sendEmail,
            errorCode,
            message: error.message,
          });
          const bypassSupabase = await createServerSupabaseClient();
          const bypassAdmin = createAdminSupabaseClient();
          if (!bypassSupabase || !bypassAdmin) {
            console.error('REGISTER_OTP_BYPASS_ERROR', {
              stage: 'missing_clients',
              hasBypassSupabase: Boolean(bypassSupabase),
              hasBypassAdmin: Boolean(bypassAdmin),
            });
            redirectPath = '/register?error=supabase&detail=otp_bypass_clients';
          } else {
            const temporaryPassword = generateOtpBypassPassword();
            const { data: createdUserData, error: createUserError } = await bypassAdmin.auth.admin.createUser({
              email,
              password: temporaryPassword,
              email_confirm: true,
              user_metadata: {
                registerBypass: true,
              },
            });

            if (createUserError) {
              console.error('REGISTER_OTP_BYPASS_CREATE_USER_ERROR', {
                message: createUserError.message,
                code:
                  typeof (createUserError as { code?: unknown }).code === 'string'
                    ? (createUserError as { code: string }).code
                    : null,
                details:
                  typeof (createUserError as { details?: unknown }).details === 'string'
                    ? ((createUserError as { details?: unknown }).details as string)
                    : null,
              });
              if (isSupabaseDuplicateError(createUserError.message)) {
                redirectDuplicateError();
              }
              redirectPath = '/register?error=supabase&detail=otp_bypass_create_user';
            } else {
              const { data: bypassSignInData, error: bypassSignInError } = await bypassSupabase.auth.signInWithPassword({
                email,
                password: temporaryPassword,
              });

              if (bypassSignInError || !bypassSignInData.user) {
                console.error('REGISTER_OTP_BYPASS_SIGNIN_ERROR', {
                  message: bypassSignInError?.message ?? null,
                  code:
                    typeof (bypassSignInError as { code?: unknown } | null)?.code === 'string'
                      ? ((bypassSignInError as { code: string }).code ?? null)
                      : null,
                  createdUserId: createdUserData.user?.id ?? null,
                });
                redirectPath = '/register?error=supabase&detail=otp_bypass_signin';
              } else {
                console.log('REGISTER_OTP_BYPASS_SUCCESS', {
                  email,
                  userId: bypassSignInData.user.id,
                });
                redirectPath = '/register/details?bypass=1';
              }
            }
          }
        } else {
          console.error('REGISTER_ERROR', {
            stage: 'otp_response_error',
            message: error.message ?? 'unknown_error',
          });
          const detail = encodeURIComponent(error.message ?? 'unknown_error');
          redirectPath = `/register?error=supabase&detail=${detail}${allowBurst ? '&burst=1' : ''}`;
        }
      } else {
        redirectPath = `/register?sent=1${allowBurst ? '&burst=1' : ''}${sendEmail ? `&sentEmail=${encodeURIComponent(sendEmail)}` : ''}`;
      }
    } catch (err) {
      if (String(err).includes('NEXT_REDIRECT')) {
        throw err;
      }
      console.error('REGISTER_ERROR', {
        stage: 'otp_request',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : null,
      });
      redirectPath = '/register?error=supabase&detail=unexpected';
    }

    redirect(redirectPath);
  } catch (error) {
    if (String(error).includes('NEXT_REDIRECT')) throw error;
    console.error('REGISTER_ERROR', {
      stage: 'request_register_verification_action',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    redirect('/register?error=supabase&detail=unexpected');
  }
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

    revalidatePath('/onboarding-preview');
    redirect('/onboarding-preview');
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

  revalidatePath('/onboarding-preview');
  redirect('/onboarding-preview');
}

export async function registerDetailsAction(formData: FormData) {
  const isRedirectThrown = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT');
  const toDbErrorMeta = (error: unknown) => {
    if (error && typeof error === 'object') {
      const maybe = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
      return {
        message: typeof maybe.message === 'string' ? maybe.message : String(maybe.message ?? 'unknown_error'),
        code: typeof maybe.code === 'string' ? maybe.code : null,
        details: typeof maybe.details === 'string' ? maybe.details : null,
        hint: typeof maybe.hint === 'string' ? maybe.hint : null,
      };
    }
    return {
      message: error instanceof Error ? error.message : String(error),
      code: null,
      details: null,
      hint: null,
    };
  };
  try {
    const safeRedirect = (to: string, context: string, details?: unknown): never => {
      console.error('REGISTER_DETAILS_ERROR', {
        context,
        redirectTo: to,
        details,
      });
      console.error('REGISTER_DETAILS_SAFE_REDIRECT', { to, context, details });
      console.log('REGISTER_DETAILS_REDIRECT_BEFORE', { to, context });
      redirect(to);
    };

    console.log('REGISTER_DETAILS_START');

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

    console.log('REGISTER_DETAILS_FORM_PARSED', {
      gender,
      nicknameLength: nickname.length,
      birthdate,
      location,
      desiredGender,
      seekingGender,
      age,
      agreeTerms,
      agreePrivacy,
      hasProfileImage: Boolean(profileImageFile && profileImageFile.size > 0),
      hasIdentityDocument: Boolean(identityFile && identityFile.size > 0),
      hasNurseDocument: Boolean(nurseFile && nurseFile.size > 0),
      profileImageSize: profileImageFile?.size ?? 0,
      identitySize: identityFile?.size ?? 0,
      nurseSize: nurseFile?.size ?? 0,
    });

    console.log('REGISTER_DETAILS_SUBMIT_START', {
      gender,
      nicknameLength: nickname.length,
      birthdate,
      location,
      desiredGender,
      agreeTerms,
      agreePrivacy,
      profileImageSize: profileImageFile?.size ?? 0,
      identitySize: identityFile?.size ?? 0,
      nurseSize: nurseFile?.size ?? 0,
    });

    if (!nickname || !birthdate || !location || age < 18) {
      safeRedirect('/register/details?error=required', 'validation_required');
    }
    if (!password) {
      safeRedirect('/register/details?error=password-required', 'validation_password_required');
    }
    if (password.length < 8) {
      safeRedirect('/register/details?error=password-length', 'validation_password_length');
    }
    if (password !== passwordConfirm) {
      safeRedirect('/register/details?error=password-mismatch', 'validation_password_mismatch');
    }
    if (!agreeTerms || !agreePrivacy) {
      safeRedirect('/register/details?error=terms-required', 'validation_terms_required');
    }
    if (!profileImageFile || profileImageFile.size <= 0) {
      safeRedirect('/register/details?error=profile-image-required', 'validation_profile_image_required');
    }
    if (!identityFile || identityFile.size <= 0) {
      safeRedirect('/register/details?error=identity-required', 'validation_identity_required');
    }
    if (gender === 'female' && (!nurseFile || nurseFile.size <= 0)) {
      safeRedirect('/register/details?error=nurse-document-required', 'validation_nurse_document_required');
    }

    if (USE_MOCK_DATA) {
      const me = await getCurrentUser();
      if (!me || me.role !== 'user') {
        safeRedirect('/register', 'mock_guard_not_user');
      }
      const checkedMe = me!;

      const isTestUser = checkedMe.isTestUser === true;
      let profileImage: string | null = null;
      let identityUrl: string | null = null;
      let nurseUrl: string | null = null;

      try {
        profileImage = await uploadDocument(profileImageFile, checkedMe.id, 'profile');
      } catch (error) {
        console.error('REGISTER_UPLOAD_ERROR', {
          stage: 'mock_profile_upload',
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error('REGISTER_DETAILS_MOCK_PROFILE_UPLOAD_ERROR', {
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'mock_profile_upload_exception');
      }
      try {
        identityUrl = await uploadDocument(identityFile, checkedMe.id, 'identity');
      } catch (error) {
        console.error('REGISTER_UPLOAD_ERROR', {
          stage: 'mock_identity_upload',
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error('REGISTER_DETAILS_MOCK_IDENTITY_UPLOAD_ERROR', {
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'mock_identity_upload_exception');
      }
      if (nurseFile && nurseFile.size > 0) {
        try {
          nurseUrl = await uploadDocument(nurseFile, checkedMe.id, 'nurse');
        } catch (error) {
          console.error('REGISTER_UPLOAD_ERROR', {
            stage: 'mock_nurse_upload',
            userId: checkedMe.id,
            message: error instanceof Error ? error.message : String(error),
          });
          console.error('REGISTER_DETAILS_MOCK_NURSE_UPLOAD_ERROR', {
            userId: checkedMe.id,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
          });
          safeRedirect('/register/details?error=unexpected', 'mock_nurse_upload_exception');
        }
      }

      const currentImages = listProfileImages(checkedMe.id);
      const uploadedImages = [profileImage].filter(Boolean) as string[];
      const hasAtLeastOneImage = uploadedImages.length > 0 || currentImages.length > 0;
      if (!isTestUser && !hasAtLeastOneImage) {
        safeRedirect('/register/details?error=profile-image-required', 'mock_profile_image_required');
      }

      try {
        if (uploadedImages.length > 0) {
          await saveProfileImages(checkedMe.id, uploadedImages);
        }
      } catch (error) {
        console.error('REGISTER_DETAILS_MOCK_PROFILE_IMAGES_SAVE_ERROR', {
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'mock_profile_images_save_exception');
      }

      try {
        await saveProfile(checkedMe.id, {
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
          profileImageUrl: uploadedImages[0] ?? checkedMe.profileImageUrl,
          nurseDocumentUrl: nurseUrl ?? '',
        });
      } catch (error) {
        console.error('REGISTER_DETAILS_MOCK_PROFILE_SAVE_ERROR', {
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'mock_profile_save_exception');
      }

      try {
        if (isTestUser) {
          if (gender === 'female') setNurseVerificationStatus(checkedMe.id, 'approved');
          if (gender === 'male') setMaleReviewStatus(checkedMe.id, 'approved');
        }
        updateUser(checkedMe.id, {
          gender,
          birthdate,
          age,
          onboardingStatus: isTestUser ? 'verified' : 'profile_completed',
          verificationStatus: isTestUser ? 'approved' : 'pending',
          identityDocumentUrl: identityUrl ?? null,
        });
      } catch (error) {
        console.error('REGISTER_DETAILS_MOCK_USER_UPDATE_ERROR', {
          userId: checkedMe.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'mock_user_update_exception');
      }

      if (isTestUser) {
        safeRedirect(gender === 'female' ? '/home/female' : '/home/male', 'mock_test_user_success');
      }
      safeRedirect('/pending-review', 'mock_pending_review_success');
    }

    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    if (!supabase || !adminSupabase) {
      safeRedirect('/register/details?error=unexpected', 'missing_supabase_clients');
    }
    const checkedSupabase = supabase!;
    const checkedAdminSupabase = adminSupabase!;
    let useSessionDbClient = false;

    const { error: adminHealthError } = await checkedAdminSupabase.from('users').select('id').limit(1);
    if (adminHealthError && isInvalidApiKeyError(adminHealthError)) {
      useSessionDbClient = true;
      console.error('REGISTER_DETAILS_DB_CLIENT_FALLBACK', {
        reason: 'admin_invalid_api_key',
        message: adminHealthError.message,
      });
    }
    const dbClient = useSessionDbClient ? checkedSupabase : checkedAdminSupabase;
    console.log('REGISTER_DETAILS_DB_CLIENT_SELECTED', {
      clientType: useSessionDbClient ? 'session' : 'admin',
    });

    const { data: authData, error: authGetError } = await checkedSupabase.auth.getUser();
    if (authGetError) {
      const authMeta = toDbErrorMeta(authGetError);
      console.error('REGISTER_DETAILS_AUTH_GET_USER_ERROR', authMeta);
      safeRedirect('/register/details?error=unexpected', 'auth_get_user_failed', authMeta);
    }
    const authUser = authData.user;
    if (!authUser) {
      safeRedirect('/register/details?error=unexpected', 'missing_auth_user');
    }
    const checkedAuthUser = authUser!;
    console.log('REGISTER_DETAILS_AUTH_USER', {
      userId: checkedAuthUser.id,
      email: checkedAuthUser.email ?? null,
      hasPhone: Boolean(checkedAuthUser.phone),
    });
    // Configured admin accounts must never be converted into member accounts
    // (registering would overwrite their role/password and lock them out of /admin).
    if (isConfiguredAdminEmail(checkedAuthUser.email)) {
      console.warn('REGISTER_DETAILS_ADMIN_EMAIL_BLOCKED', {
        userId: checkedAuthUser.id,
        email: checkedAuthUser.email ?? null,
      });
      safeRedirect('/admin', 'admin_email_blocked');
    }
    if (password) {
      const { error: passwordError } = await checkedSupabase.auth.updateUser({ password });
      if (passwordError) {
        const passwordMeta = toDbErrorMeta(passwordError);
        if (passwordMeta.code === 'same_password') {
          // Allow users to re-submit the form with their current password during retries.
          console.warn('REGISTER_DETAILS_PASSWORD_UPDATE_SKIPPED', passwordMeta);
        } else {
          console.error('REGISTER_DETAILS_PASSWORD_UPDATE_ERROR', passwordMeta);
          safeRedirect('/register/details?error=unexpected', 'password_update_failed', passwordMeta);
        }
      }
    }

    const userId = checkedAuthUser.id;

    let profileImage: string | null = null;
    let identityUrl: string | null = null;
    let nurseUrl: string | null = null;

    console.log('REGISTER_DETAILS_PROFILE_UPLOAD_START', {
      userId,
      hasProfileImage: Boolean(profileImageFile && profileImageFile.size > 0),
    });
    try {
      profileImage = await uploadDocument(profileImageFile, userId, 'profile');
    } catch (error) {
      console.error('REGISTER_UPLOAD_ERROR', {
        stage: 'profile_upload',
        userId,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error('REGISTER_DETAILS_PROFILE_UPLOAD_EXCEPTION', {
        userId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });
      safeRedirect('/register/details?error=unexpected', 'profile_upload_exception');
    }
    console.log('REGISTER_DETAILS_PROFILE_UPLOAD_DONE', {
      userId,
      uploaded: Boolean(profileImage),
    });
    try {
      identityUrl = await uploadDocument(identityFile, userId, 'identity');
    } catch (error) {
      console.error('REGISTER_UPLOAD_ERROR', {
        stage: 'identity_upload',
        userId,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error('REGISTER_DETAILS_IDENTITY_UPLOAD_EXCEPTION', {
        userId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });
      safeRedirect('/register/details?error=unexpected', 'identity_upload_exception');
    }
    if (nurseFile && nurseFile.size > 0) {
      try {
        nurseUrl = await uploadDocument(nurseFile, userId, 'nurse');
      } catch (error) {
        console.error('REGISTER_UPLOAD_ERROR', {
          stage: 'nurse_upload',
          userId,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error('REGISTER_DETAILS_NURSE_UPLOAD_EXCEPTION', {
          userId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'nurse_upload_exception');
      }
    }

    const uploadedImages = [profileImage].filter(Boolean) as string[];

    const { data: existingUser, error: existingUserError } = await dbClient.from('users').select('*').eq('id', userId).maybeSingle();
    if (existingUserError) {
      const usersSelectMeta = toDbErrorMeta(existingUserError);
      console.error('REGISTER_DETAILS_USERS_SELECT_ERROR', { userId, ...usersSelectMeta });
      safeRedirect('/register/details?error=unexpected', 'users_select_failed', usersSelectMeta);
    }
    if (existingUser && existingUser.role !== 'user') {
      console.warn('REGISTER_DETAILS_NON_USER_ROLE_CONTINUE', {
        userId,
        previousRole: existingUser.role,
        nextRole: 'user',
      });
    }
    const isTestUser = existingUser?.is_test_user === true;

    const primaryImage = uploadedImages[0] ?? existingUser?.profile_image_url ?? '';
    console.log('REGISTER_DETAILS_USER_UPSERT_START', {
      userId,
      hasExistingUser: Boolean(existingUser),
      isTestUser,
      hasPrimaryImage: Boolean(primaryImage),
    });
    const { error: userUpsertError } = await dbClient.from('users').upsert(
      {
        id: userId,
        email: normalizeEmail(checkedAuthUser.email ?? existingUser?.email ?? ''),
        phone: checkedAuthUser.phone ? normalizePhone(checkedAuthUser.phone) : (existingUser?.phone ?? null),
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
        verification_status: isTestUser ? 'approved' : 'pending',
        identity_document_url: identityUrl ?? existingUser?.identity_document_url ?? null,
        rejected_reason: existingUser?.rejected_reason ?? null,
        moderation_action: existingUser?.moderation_action ?? 'none',
        is_suspended: existingUser?.is_suspended ?? false,
        is_test_user: existingUser?.is_test_user ?? false,
      },
      { onConflict: 'id' },
    );
    if (userUpsertError) {
      const usersUpsertMeta = toDbErrorMeta(userUpsertError);
      console.error('REGISTER_DETAILS_USERS_UPSERT_ERROR', { userId, ...usersUpsertMeta });
      safeRedirect('/register/details?error=unexpected', 'users_upsert_failed', usersUpsertMeta);
    }
    console.log('REGISTER_DETAILS_USER_UPSERT_DONE', { userId });

    if (uploadedImages.length > 0) {
      try {
        await saveProfileImages(userId, uploadedImages);
      } catch (error) {
        console.error('REGISTER_DETAILS_PROFILE_IMAGES_SAVE_EXCEPTION', {
          userId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        });
        safeRedirect('/register/details?error=unexpected', 'profile_images_save_exception');
      }
    }

    if (gender === 'female') {
      const nurseStatus = isTestUser ? 'approved' : 'pending';
      console.log('REGISTER_DETAILS_FEMALE_PROFILE_UPSERT_START', {
        userId,
        nurseStatus,
        hasNurseDocument: Boolean(nurseUrl),
      });
      const { error: femaleUpsertError } = await dbClient.from('female_profiles').upsert(
        {
          user_id: userId,
          nurse_document_url: nurseUrl ?? '',
          nurse_verification_status: nurseStatus,
          workplace_type: 'hospital',
          has_night_shift: false,
        },
        { onConflict: 'user_id' },
      );
      if (femaleUpsertError) {
        const femaleUpsertMeta = toDbErrorMeta(femaleUpsertError);
        console.error('REGISTER_DETAILS_FEMALE_PROFILES_UPSERT_ERROR', { userId, ...femaleUpsertMeta });
        safeRedirect('/register/details?error=unexpected', 'female_profiles_upsert_failed', femaleUpsertMeta);
      }
      console.log('REGISTER_DETAILS_FEMALE_PROFILE_UPSERT_DONE', { userId });
      const { data: existingIdentity, error: identitySelectError } = await dbClient
        .from('identity_documents')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (identitySelectError) {
        const identitySelectMeta = toDbErrorMeta(identitySelectError);
        console.error('REGISTER_DETAILS_IDENTITY_SELECT_ERROR', { userId, ...identitySelectMeta });
        safeRedirect('/register/details?error=unexpected', 'identity_select_failed', identitySelectMeta);
      }
      if (existingIdentity?.id) {
        const { error: identityUpdateError } = await dbClient
          .from('identity_documents')
          .update({ document_url: identityUrl ?? '', status: isTestUser ? 'approved' : 'pending' })
          .eq('id', existingIdentity.id);
        if (identityUpdateError) {
          const identityUpdateMeta = toDbErrorMeta(identityUpdateError);
          console.error('REGISTER_DETAILS_IDENTITY_UPDATE_ERROR', { userId, ...identityUpdateMeta });
          safeRedirect('/register/details?error=unexpected', 'identity_update_failed', identityUpdateMeta);
        }
      } else {
        const { error: identityInsertError } = await dbClient.from('identity_documents').insert({
          user_id: userId,
          document_url: identityUrl ?? '',
          status: isTestUser ? 'approved' : 'pending',
        });
        if (identityInsertError) {
          const identityInsertMeta = toDbErrorMeta(identityInsertError);
          console.error('REGISTER_DETAILS_IDENTITY_INSERT_ERROR', { userId, ...identityInsertMeta });
          safeRedirect('/register/details?error=unexpected', 'identity_insert_failed', identityInsertMeta);
        }
      }
      if (isTestUser) {
        safeRedirect('/home/female', 'female_test_user_success');
      }
      console.log('REGISTER_DETAILS_REDIRECT_PENDING_REVIEW', {
        userId,
        gender: 'female',
      });
      safeRedirect('/pending-review', 'female_pending_review_success');
    }

    const maleStatus = isTestUser ? 'approved' : 'pending';
    const { error: maleUpsertError } = await dbClient.from('male_profiles').upsert(
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
    if (maleUpsertError) {
      const maleUpsertMeta = toDbErrorMeta(maleUpsertError);
      console.error('REGISTER_DETAILS_MALE_PROFILES_UPSERT_ERROR', { userId, ...maleUpsertMeta });
      safeRedirect('/register/details?error=unexpected', 'male_profiles_upsert_failed', maleUpsertMeta);
    }
    const { data: existingIdentity, error: identitySelectError } = await dbClient.from('identity_documents').select('id').eq('user_id', userId).maybeSingle();
    if (identitySelectError) {
      const identitySelectMeta = toDbErrorMeta(identitySelectError);
      console.error('REGISTER_DETAILS_IDENTITY_SELECT_ERROR', { userId, ...identitySelectMeta });
      safeRedirect('/register/details?error=unexpected', 'identity_select_failed', identitySelectMeta);
    }
    if (existingIdentity?.id) {
      const { error: identityUpdateError } = await dbClient
        .from('identity_documents')
        .update({ document_url: identityUrl ?? '', status: isTestUser ? 'approved' : 'pending' })
        .eq('id', existingIdentity.id);
      if (identityUpdateError) {
        const identityUpdateMeta = toDbErrorMeta(identityUpdateError);
        console.error('REGISTER_DETAILS_IDENTITY_UPDATE_ERROR', { userId, ...identityUpdateMeta });
        safeRedirect('/register/details?error=unexpected', 'identity_update_failed', identityUpdateMeta);
      }
    } else {
      const { error: identityInsertError } = await dbClient.from('identity_documents').insert({
        user_id: userId,
        document_url: identityUrl ?? '',
        status: isTestUser ? 'approved' : 'pending',
      });
      if (identityInsertError) {
        const identityInsertMeta = toDbErrorMeta(identityInsertError);
        console.error('REGISTER_DETAILS_IDENTITY_INSERT_ERROR', { userId, ...identityInsertMeta });
        safeRedirect('/register/details?error=unexpected', 'identity_insert_failed', identityInsertMeta);
      }
    }
    if (isTestUser) {
      safeRedirect('/home/male', 'male_test_user_success');
    }
    console.log('REGISTER_DETAILS_REDIRECT_PENDING_REVIEW', {
      userId,
      gender: 'male',
    });
    safeRedirect('/pending-review', 'male_pending_review_success');
  } catch (error) {
    if (isRedirectThrown(error)) {
      throw error;
    }
    console.error('REGISTER_DETAILS_ERROR', {
      context: 'top_level_exception',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    console.error('REGISTER_DETAILS_TOP_LEVEL_EXCEPTION', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    console.error('REGISTER_DETAILS_SAFE_REDIRECT', {
      to: '/register/details?error=unexpected',
      context: 'top_level_exception_fallback',
    });
    console.log('REGISTER_DETAILS_REDIRECT_BEFORE', {
      to: '/register/details?error=unexpected',
      context: 'top_level_exception_fallback',
    });
    redirect('/register/details?error=unexpected');
  }
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
  revalidatePath('/onboarding-preview');
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
  revalidatePath('/onboarding-preview');
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
