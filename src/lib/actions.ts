'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  blockUser,
  createReport,
  createInterestSignal,
  getCurrentUser,
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
import { getUserByEmail, updateUser } from '@/lib/mock-data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uploadDocument } from '@/lib/upload';
import type { MaritalStatus, ModerationAction, ReportReasonType, ReportStatus } from '@/lib/types/domain';
import type { Database } from '@/lib/types/database';

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const me = await getCurrentUser();
  if (me) redirect(resolvePostLoginPath(me));
  redirect('/login');
}

function resolveRequestOrigin(hostname: string | null, proto: string | null) {
  if (!hostname) return null;
  const scheme = proto === 'http' || proto === 'https' ? proto : 'https';
  return `${scheme}://${hostname}`;
}

export async function requestRegisterVerificationAction(formData: FormData) {
  const method = String(formData.get('method') ?? 'email');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();

  if (method === 'sms') {
    redirect('/register?status=sms-preparing');
  }

  if (!email && !phone) {
    redirect('/register?error=contact-required');
  }

  if (!email) {
    redirect('/register?error=email-required');
  }

  if (USE_MOCK_DATA) {
    redirect(`/register?status=sent-email&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect('/register?error=config');
  }

  const headerStore = await headers();
  const requestOrigin = resolveRequestOrigin(headerStore.get('x-forwarded-host') ?? headerStore.get('host'), headerStore.get('x-forwarded-proto'));
  const emailRedirectTo = requestOrigin ? `${requestOrigin}/register/details` : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect('/register?error=send-failed');
  }

  redirect(`/register?status=sent-email&email=${encodeURIComponent(email)}`);
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
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? '').trim(),
    job: String(formData.get('job') ?? '').trim(),
    income: String(formData.get('income') ?? '').trim(),
    maritalStatus: String(formData.get('maritalStatus') ?? 'single') as MaritalStatus,
  };

  if (!payload.nickname || !payload.email || !payload.password) {
    throw new Error('必須項目が不足しています');
  }

  if (USE_MOCK_DATA) {
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
      desiredGender: payload.desiredGender,
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
      desiredGender: payload.desiredGender,
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

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });
  if (signUpError) throw new Error(signUpError.message);

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

export async function swipeAction(formData: FormData) {
  const fromUserId = String(formData.get('fromUserId'));
  const toUserId = String(formData.get('toUserId'));
  const action = String(formData.get('action')) as 'like' | 'skip';

  await swipe(fromUserId, toUserId, action);
  revalidatePath('/home/female');
  revalidatePath('/matches');
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
}

export async function blockUserAction(formData: FormData) {
  const blockerUserId = String(formData.get('blockerUserId'));
  const blockedUserId = String(formData.get('blockedUserId'));
  await blockUser(blockerUserId, blockedUserId);

  revalidatePath('/blocked-users');
  revalidatePath('/home/female');
  revalidatePath('/matches');
  revalidatePath('/chat');
}

export async function markRelationshipModeAction(formData: FormData) {
  const matchId = String(formData.get('matchId'));
  const actorUserId = String(formData.get('actorUserId'));

  await markMatchAsRelationshipMode(matchId, actorUserId);
  revalidatePath('/matches');
  revalidatePath(`/chat/${matchId}`);
  revalidatePath('/home/female');
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

export async function createReportAction(formData: FormData) {
  const reporterId = String(formData.get('reporterId'));
  const targetUserId = String(formData.get('targetUserId'));
  const reason = String(formData.get('reason') ?? '通報');
  const reasonType = String(formData.get('reasonType') ?? 'other') as ReportReasonType;
  const detail = String(formData.get('detail') ?? '');

  await createReport({ reporterId, targetUserId, reason, reasonType, detail });
  revalidatePath('/admin');
  revalidatePath('/chat');
}
