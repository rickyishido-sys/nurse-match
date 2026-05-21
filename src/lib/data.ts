import { cookies } from 'next/headers';
import { USE_MOCK_DATA } from '@/lib/config';
import {
  addAdminAction,
  addBlock,
  addCreditTransaction,
  addLike,
  addMessage,
  addReport,
  getRiskCheck,
  getCreditByUser,
  listDailyRecommendations,
  listInterestSignalsByUser,
  listInterestSignalsForTarget,
  ensureMatch,
  getFemaleProfile,
  getMaleProfile,
  getMatchById,
  getUserById,
  isBlockedBetween,
  listAdminActions,
  listBlocksForUser,
  listLikes,
  listMatchesForUser,
  listMessages,
  listFavorites,
  listReports,
  listProfileImages,
  listUsers,
  replaceProfileImages,
  replaceDailyRecommendations,
  upsertCredit,
  upsertInterestSignal,
  toggleFavorite,
  setMaleReviewStatus,
  setNurseVerificationStatus,
  setReportStatus,
  updateMatch,
  updateUser,
  updateUserModeration,
  upsertRiskCheck,
  upsertFemaleProfile,
  upsertMaleProfile,
} from '@/lib/mock-data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAdminSignedDocumentUrl, getSignedProfileImageUrl } from '@/lib/storage';
import type {
  AdminActionType,
  AppUser,
  DailyRecommendationRecord,
  FemaleProfile,
  InterestSignalType,
  MaleProfile,
  MaritalStatus,
  ModerationAction,
  OnboardingStatus,
  ProfileImageRecord,
  ReportReasonType,
  ReportStatus,
  RiskCheckRecord,
  RiskCheckStatus,
} from '@/lib/types/domain';
import type { Database } from '@/lib/types/database';

function mapUser(row: Database['public']['Tables']['users']['Row']): AppUser {
  const seeking = row.seeking_gender ?? row.desired_gender;
  const isTestUser = row.is_test_user;
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    role: row.role,
    gender: row.gender,
    nickname: row.nickname,
    birthdate: row.birthdate,
    age: row.age,
    location: row.location,
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    desiredGender: seeking,
    onboardingStatus: isTestUser ? 'verified' : row.onboarding_status,
    riskCheckStatus: row.risk_check_status,
    verificationStatus: isTestUser ? 'approved' : row.verification_status,
    identityDocumentUrl: row.identity_document_url,
    rejectedReason: row.rejected_reason,
    moderationAction: row.moderation_action,
    isSuspended: row.is_suspended,
    isTestUser,
  };
}

function mapProfileImage(row: Database['public']['Tables']['profile_images']['Row']): ProfileImageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isMain: row.is_main,
    approvedStatus: row.approved_status,
  };
}

function mapFemale(row: Database['public']['Tables']['female_profiles']['Row']): FemaleProfile {
  return {
    userId: row.user_id,
    nurseDocumentUrl: row.nurse_document_url,
    nurseVerificationStatus: row.nurse_verification_status,
    workplaceType: row.workplace_type,
    hasNightShift: row.has_night_shift,
  };
}

function mapMale(row: Database['public']['Tables']['male_profiles']['Row']): MaleProfile {
  return {
    userId: row.user_id,
    job: row.job,
    income: row.income,
    maritalStatus: row.marital_status,
    hasChildren: row.has_children,
    maleReviewStatus: row.male_review_status,
    incomeVerified: row.income_verified,
    facePhotoVerified: row.face_photo_verified,
    internalMemo: row.internal_memo,
    height: row.height ?? 170,
    bodyType: row.body_type ?? '',
    holiday: row.holiday ?? '',
    smoking: row.smoking ?? '',
    drinking: row.drinking ?? '',
    nightShiftUnderstanding: row.night_shift_understanding,
    shiftWorkUnderstanding: row.shift_work_understanding,
    lateNightContactOk: row.late_night_contact_ok,
    firstDateCost: row.first_date_cost ?? '',
    personalityTags: row.personality_tags ?? [],
  };
}

function mapPublicUserCard(row: Database['public']['Views']['public_user_cards']['Row']): AppUser {
  const seeking = row.seeking_gender ?? row.desired_gender;
  return {
    id: row.id,
    email: '',
    phone: null,
    role: 'user',
    gender: row.gender,
    nickname: row.nickname,
    birthdate: '',
    age: row.age,
    location: row.location,
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    desiredGender: seeking,
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: row.verification_status,
    identityDocumentUrl: null,
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: row.is_suspended,
    isTestUser: false,
  };
}

async function resolveProfileImage(user: AppUser) {
  if (USE_MOCK_DATA) return user;
  const signed = await getSignedProfileImageUrl(user.profileImageUrl);
  return {
    ...user,
    profileImageUrl: signed ?? user.profileImageUrl,
  };
}

async function resolveProfileImages(images: ProfileImageRecord[]) {
  if (USE_MOCK_DATA) return images;
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      imageUrl: (await getSignedProfileImageUrl(image.imageUrl)) ?? image.imageUrl,
    })),
  );
}

export async function getProfileImagesByUserId(userId: string) {
  if (USE_MOCK_DATA) {
    return listProfileImages(userId);
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('profile_images')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .limit(3);
  return resolveProfileImages((data ?? []).map(mapProfileImage));
}

async function getBlockedRelationSetForUser(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Set<string>();

  const { data } = await supabase
    .from('blocks')
    .select('blocker_user_id, blocked_user_id')
    .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`);

  const set = new Set<string>();
  (data ?? []).forEach((row) => {
    set.add(row.blocker_user_id === userId ? row.blocked_user_id : row.blocker_user_id);
  });
  return set;
}

export type FemaleSearchFilters = {
  maritalFilter: 'single_only' | 'include_married' | 'include_partner';
  ageMin: number;
  ageMax: number;
  location: string;
  job: string;
  incomeMin: string;
  smoking: string;
  drinking: string;
  heightMin: number;
  verifiedOnly: boolean;
  maleReviewedOnly: boolean;
  incomeVerifiedOnly: boolean;
  facePhotoOnly: boolean;
};

export const DEFAULT_FEMALE_FILTERS: FemaleSearchFilters = {
  maritalFilter: 'single_only',
  ageMin: 24,
  ageMax: 45,
  location: '',
  job: '',
  incomeMin: '',
  smoking: '',
  drinking: '',
  heightMin: 0,
  verifiedOnly: true,
  maleReviewedOnly: true,
  incomeVerifiedOnly: false,
  facePhotoOnly: false,
};

function normalizeFemaleFilterCookie(value?: string | null): Partial<Record<keyof FemaleSearchFilters, string | boolean>> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<keyof FemaleSearchFilters, string | boolean>>) : {};
  } catch {
    return {};
  }
}

function canSeek(user: Pick<AppUser, 'desiredGender'>, targetGender: 'male' | 'female') {
  return user.desiredGender === 'both' || user.desiredGender === targetGender;
}

async function getFemalePreferenceFiltersForUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('female_search_filters')?.value;
  const parsed = normalizeFemaleFilterCookie(raw);
  return {
    maritalFilter: (parsed.maritalFilter as FemaleSearchFilters['maritalFilter']) ?? DEFAULT_FEMALE_FILTERS.maritalFilter,
    ageMin: Number(parsed.ageMin ?? DEFAULT_FEMALE_FILTERS.ageMin),
    ageMax: Number(parsed.ageMax ?? DEFAULT_FEMALE_FILTERS.ageMax),
    location: String(parsed.location ?? DEFAULT_FEMALE_FILTERS.location),
    job: String(parsed.job ?? DEFAULT_FEMALE_FILTERS.job),
    incomeMin: String(parsed.incomeMin ?? DEFAULT_FEMALE_FILTERS.incomeMin),
    smoking: String(parsed.smoking ?? DEFAULT_FEMALE_FILTERS.smoking),
    drinking: String(parsed.drinking ?? DEFAULT_FEMALE_FILTERS.drinking),
    heightMin: Number(parsed.heightMin ?? DEFAULT_FEMALE_FILTERS.heightMin),
    verifiedOnly: parsed.verifiedOnly === true || parsed.verifiedOnly === 'on' ? true : DEFAULT_FEMALE_FILTERS.verifiedOnly,
    maleReviewedOnly:
      parsed.maleReviewedOnly === true || parsed.maleReviewedOnly === 'on' ? true : DEFAULT_FEMALE_FILTERS.maleReviewedOnly,
    incomeVerifiedOnly:
      parsed.incomeVerifiedOnly === true || parsed.incomeVerifiedOnly === 'on'
        ? true
        : DEFAULT_FEMALE_FILTERS.incomeVerifiedOnly,
    facePhotoOnly:
      parsed.facePhotoOnly === true || parsed.facePhotoOnly === 'on' ? true : DEFAULT_FEMALE_FILTERS.facePhotoOnly,
  } satisfies FemaleSearchFilters;
}

function matchesFemalePreference(input: {
  femaleUser: AppUser;
  femaleProfile: FemaleProfile | null;
  maleUser: AppUser;
  maleProfile: MaleProfile | null;
  filters: FemaleSearchFilters;
}) {
  const { femaleUser, femaleProfile, maleUser, maleProfile, filters } = input;
  if (!maleProfile) return false;
  if (maleUser.gender !== 'male') return false;
  if (!canSeek(femaleUser, 'male')) return false;
  if (maleUser.age < filters.ageMin || maleUser.age > filters.ageMax) return false;
  if (filters.location && !maleUser.location.includes(filters.location)) return false;
  if (filters.job && !maleProfile.job.includes(filters.job)) return false;
  if (filters.incomeMin && maleProfile.income < filters.incomeMin) return false;
  if (filters.smoking && maleProfile.smoking !== filters.smoking) return false;
  if (filters.drinking && maleProfile.drinking !== filters.drinking) return false;
  if (filters.heightMin > 0 && maleProfile.height < filters.heightMin) return false;
  if (filters.maritalFilter === 'single_only' && maleProfile.maritalStatus !== 'single') return false;
  if (filters.maritalFilter === 'include_married' && maleProfile.maritalStatus === 'partner') return false;
  if (filters.incomeVerifiedOnly && !maleProfile.incomeVerified) return false;
  if (filters.facePhotoOnly && !maleProfile.facePhotoVerified) return false;
  if (filters.maleReviewedOnly && maleProfile.maleReviewStatus !== 'approved') return false;
  if (femaleProfile?.hasNightShift && (!maleProfile.nightShiftUnderstanding || !maleProfile.shiftWorkUnderstanding)) return false;
  return true;
}

function getJstDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
}

function isSameJstDate(iso: string, date: string) {
  return getJstDateString(new Date(iso)) === date;
}

function recommendationReason(rank: number) {
  if (rank <= 3) return '希望条件との一致度が高い候補です';
  if (rank <= 6) return '価値観と生活リズムの相性が良い候補です';
  return '今日の新着候補としておすすめです';
}

async function ensureUserCreditWallet(userId: string) {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user) return null;
    const current = getCreditByUser(userId);
    if (current) return current;
    const initial = user.gender === 'male' ? 10 : 0;
    return upsertCredit(userId, initial);
  }
  const admin = createAdminSupabaseClient();
  if (!admin) return null;
  const { data: user } = await admin.from('users').select('id,gender').eq('id', userId).maybeSingle();
  if (!user) return null;
  const { data: existing } = await admin.from('credits').select('*').eq('user_id', userId).maybeSingle();
  if (existing) return existing;
  const initial = user.gender === 'male' ? 10 : 0;
  await admin.from('credits').insert({ user_id: userId, balance: initial });
  const { data: created } = await admin.from('credits').select('*').eq('user_id', userId).maybeSingle();
  return created ?? null;
}

async function consumeCredit(input: { userId: string; amount: number; reason: string; relatedMatchId?: string | null }) {
  if (input.amount <= 0) return;
  if (USE_MOCK_DATA) {
    const wallet = await ensureUserCreditWallet(input.userId);
    if (!wallet) return;
    const next = Math.max(0, wallet.balance - input.amount);
    upsertCredit(input.userId, next);
    addCreditTransaction({
      userId: input.userId,
      type: 'consume',
      amount: -Math.abs(input.amount),
      reason: input.reason,
      relatedMatchId: input.relatedMatchId,
    });
    return;
  }
  const admin = createAdminSupabaseClient();
  if (!admin) return;
  const wallet = await ensureUserCreditWallet(input.userId);
  if (!wallet) return;
  const balance = typeof wallet.balance === 'number' ? wallet.balance : 0;
  const next = Math.max(0, balance - input.amount);
  await admin.from('credits').update({ balance: next }).eq('user_id', input.userId);
  await admin.from('credit_transactions').insert({
    user_id: input.userId,
    type: 'consume',
    amount: -Math.abs(input.amount),
    reason: input.reason,
    related_match_id: input.relatedMatchId ?? null,
  });
}

export async function getUserCreditBalance(userId: string) {
  const wallet = await ensureUserCreditWallet(userId);
  if (!wallet) return 0;
  return typeof wallet.balance === 'number' ? wallet.balance : 0;
}

async function canUseChatByUser(userId: string) {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user) return false;
    if (user.isTestUser) return !user.isSuspended;
    if (user.isSuspended || user.verificationStatus === 'rejected' || user.verificationStatus !== 'approved') return false;
    if (user.gender === 'female') {
      const fp = getFemaleProfile(user.id);
      return Boolean(fp && fp.nurseVerificationStatus === 'approved');
    }
    const mp = getMaleProfile(user.id);
    return Boolean(mp && mp.maleReviewStatus === 'approved');
  }
  const admin = createAdminSupabaseClient();
  if (!admin) return false;
  const { data: user } = await admin
    .from('users')
    .select('id,gender,is_suspended,verification_status,is_test_user')
    .eq('id', userId)
    .maybeSingle();
  if (!user) return false;
  if (user.is_test_user) return !user.is_suspended;
  if (user.is_suspended || user.verification_status !== 'approved') return false;
  if (user.gender === 'female') {
    const { data: fp } = await admin
      .from('female_profiles')
      .select('nurse_verification_status')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(fp && fp.nurse_verification_status === 'approved');
  }
  const { data: mp } = await admin.from('male_profiles').select('male_review_status').eq('user_id', userId).maybeSingle();
  return Boolean(mp && mp.male_review_status === 'approved');
}

const RELATIONSHIP_DELETE_AFTER_DAYS = 60;

function isMatchActive(match: Pick<Database['public']['Tables']['matches']['Row'], 'relationship_status'>) {
  return match.relationship_status === 'active';
}

function hasAnyRelationshipModeInMock(userId: string) {
  return listMatchesForUser(userId).some((match) => match.relationshipStatus !== 'active');
}

async function hasAnyRelationshipMode(userId: string) {
  if (USE_MOCK_DATA) return hasAnyRelationshipModeInMock(userId);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from('matches')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .in('relationship_status', ['relationship_mode', 'scheduled_delete'])
    .limit(1);
  return Boolean(data && data.length > 0);
}

async function isBlockedBetweenUsers(userAId: string, userBId: string) {
  if (USE_MOCK_DATA) return isBlockedBetween(userAId, userBId);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from('blocks')
    .select('id')
    .or(`and(blocker_user_id.eq.${userAId},blocked_user_id.eq.${userBId}),and(blocker_user_id.eq.${userBId},blocked_user_id.eq.${userAId})`)
    .maybeSingle();

  return Boolean(data);
}

async function insertAdminActionLog(input: {
  adminUserId: string;
  targetUserId: string;
  actionType: AdminActionType;
  beforeValue?: string | null;
  afterValue?: string | null;
  note?: string | null;
}) {
  if (USE_MOCK_DATA) {
    addAdminAction(input);
    return;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return;

  await admin.from('admin_actions').insert({
    admin_user_id: input.adminUserId,
    target_user_id: input.targetUserId,
    action_type: input.actionType,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    note: input.note ?? null,
  });

  const auditActionMap: Partial<Record<AdminActionType, Database['public']['Tables']['admin_audit_logs']['Insert']['action']>> = {
    verification_status_changed: input.afterValue === 'approved' ? 'approve' : input.afterValue === 'rejected' ? 'reject' : undefined,
    nurse_verification_status_changed: input.afterValue === 'approved' ? 'approve' : input.afterValue === 'rejected' ? 'reject' : undefined,
    male_review_status_changed: input.afterValue === 'approved' ? 'approve' : input.afterValue === 'rejected' ? 'reject' : undefined,
    user_suspended: input.afterValue === 'true' ? 'suspend' : undefined,
    user_permanent_banned: 'permanent_ban',
  };
  const auditAction = auditActionMap[input.actionType];
  if (auditAction) {
    await admin.from('admin_audit_logs').insert({
      admin_user_id: input.adminUserId,
      target_user_id: input.targetUserId,
      action: auditAction,
      reason: input.note ?? null,
    });
  }
}

export async function getCurrentUser() {
  if (USE_MOCK_DATA) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('demo_user_id')?.value ?? 'u_f_1';
    return getUserById(userId);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
  if (error || !data) return null;

  return resolveProfileImage(mapUser(data));
}

export async function getFemaleProfileByUserId(userId: string) {
  if (USE_MOCK_DATA) return getFemaleProfile(userId);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.from('female_profiles').select('*').eq('user_id', userId).maybeSingle();
  return data ? mapFemale(data) : null;
}

export async function getMaleProfileByUserId(userId: string) {
  if (USE_MOCK_DATA) return getMaleProfile(userId);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.from('male_profiles').select('*').eq('user_id', userId).maybeSingle();
  return data ? mapMale(data) : null;
}

export async function getCandidateCards(user: AppUser, filters: FemaleSearchFilters) {
  if (await hasAnyRelationshipMode(user.id)) return [];

  if (USE_MOCK_DATA) {
    const allUsers = listUsers();
    const alreadySwiped = new Set(
      listLikes()
        .filter((like) => like.fromUserId === user.id)
        .map((like) => like.toUserId),
    );
    const blocked = new Set(listBlocksForUser(user.id).map((b) => b.blockedUserId));
    const signalTargetSet = new Set(
      listInterestSignalsForTarget(user.id)
        .filter((signal) => signal.signalType === 'interested' && signal.matchedPreference && signal.expiresAt > new Date().toISOString())
        .map((signal) => signal.userId),
    );

    return allUsers
      .filter((candidate) => candidate.id !== user.id)
      .filter((candidate) => !candidate.isSuspended)
      .filter((candidate) => candidate.verificationStatus === 'approved')
      .filter((candidate) => !hasAnyRelationshipModeInMock(candidate.id))
      .filter((candidate) => !alreadySwiped.has(candidate.id))
      .filter((candidate) => !blocked.has(candidate.id) && !isBlockedBetween(user.id, candidate.id))
      .filter((candidate) => {
        if (candidate.gender === 'male') {
          const mp = getMaleProfile(candidate.id);
          if (!mp || mp.maleReviewStatus !== 'approved') return false;
          if (filters.maritalFilter === 'single_only') return mp.maritalStatus === 'single';
          if (filters.maritalFilter === 'include_married') return mp.maritalStatus !== 'partner';
          return true;
        }

        const femaleProfile = getFemaleProfile(candidate.id);
        return femaleProfile?.nurseVerificationStatus === 'approved';
      })
      .filter((candidate) => candidate.age >= filters.ageMin && candidate.age <= filters.ageMax)
      .filter((candidate) => (filters.location ? candidate.location.includes(filters.location) : true))
      .filter((candidate) => {
        if (candidate.gender !== 'male') return true;
        const mp = getMaleProfile(candidate.id);
        if (!mp) return false;
        if (filters.job && !mp.job.includes(filters.job)) return false;
        if (filters.smoking && mp.smoking !== filters.smoking) return false;
        if (filters.drinking && mp.drinking !== filters.drinking) return false;
        if (filters.heightMin > 0 && mp.height < filters.heightMin) return false;
        if (filters.incomeMin && mp.income < filters.incomeMin) return false;
        if (filters.incomeVerifiedOnly && !mp.incomeVerified) return false;
        if (filters.facePhotoOnly && !mp.facePhotoVerified) return false;
        if (filters.maleReviewedOnly && mp.maleReviewStatus !== 'approved') return false;
        return true;
      })
      .sort((a, b) => {
        const aSignal = signalTargetSet.has(a.id) ? 1 : 0;
        const bSignal = signalTargetSet.has(b.id) ? 1 : 0;
        if (aSignal !== bSignal) return bSignal - aSignal;
        return sortByRecommendationPriority(user, a, b);
      })
      .map((candidate) => ({
        user: {
          ...candidate,
          profileImageUrl: listProfileImages(candidate.id).find((img) => img.isMain)?.imageUrl ?? candidate.profileImageUrl,
        },
        maleProfile: getMaleProfile(candidate.id),
        femaleProfile: getFemaleProfile(candidate.id),
        profileImages: listProfileImages(candidate.id),
      }));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const admin = createAdminSupabaseClient();

  const blockedSet = await getBlockedRelationSetForUser(user.id);

  const { data: usersData } = await supabase
    .from('public_user_cards')
    .select('*')
    .eq('verification_status', 'approved')
    .eq('is_suspended', false)
    .neq('id', user.id);

  const { data: likesData } = await supabase.from('likes').select('to_user_id').eq('from_user_id', user.id);
  const swipedIds = new Set((likesData ?? []).map((row) => row.to_user_id));

  const [{ data: females }, { data: males }, { data: signalRows }] = await Promise.all([
    supabase.from('female_profile_public').select('*'),
    supabase.from('male_profile_public').select('*'),
    admin
      ? admin
          .from('interest_signals')
          .select('user_id')
          .eq('target_user_id', user.id)
          .eq('signal_type', 'interested')
          .eq('matched_preference', true)
          .gte('expires_at', new Date().toISOString())
      : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
  ]);
  const signalTargetSet = new Set((signalRows ?? []).map((row) => row.user_id));

  const femaleMap = new Map(
    (females ?? []).map((f) => [
      f.user_id,
      {
        userId: f.user_id,
        nurseDocumentUrl: '',
        nurseVerificationStatus: f.nurse_verification_status,
        workplaceType: f.workplace_type,
        hasNightShift: f.has_night_shift,
      } satisfies FemaleProfile,
    ]),
  );
  const maleMap = new Map(
    (males ?? []).map((m) => [
      m.user_id,
      {
        userId: m.user_id,
        job: m.job,
        income: m.income,
        maritalStatus: m.marital_status,
        hasChildren: m.has_children,
        maleReviewStatus: m.male_review_status,
        incomeVerified: m.income_verified,
        facePhotoVerified: m.face_photo_verified,
        internalMemo: null,
        height: m.height ?? 170,
        bodyType: m.body_type ?? '',
        holiday: m.holiday ?? '',
        smoking: m.smoking ?? '',
        drinking: m.drinking ?? '',
        nightShiftUnderstanding: m.night_shift_understanding,
        shiftWorkUnderstanding: m.shift_work_understanding,
        lateNightContactOk: m.late_night_contact_ok,
        firstDateCost: m.first_date_cost ?? '',
        personalityTags: m.personality_tags ?? [],
      } satisfies MaleProfile,
    ]),
  );

  const filtered = (usersData ?? [])
    .map((u) => mapPublicUserCard(u))
    .filter((candidate) => !swipedIds.has(candidate.id))
    .filter((candidate) => !blockedSet.has(candidate.id))
    .filter((candidate) => candidate.age >= filters.ageMin && candidate.age <= filters.ageMax)
    .filter((candidate) => (filters.location ? candidate.location.includes(filters.location) : true))
    .filter((candidate) => {
      if (candidate.gender === 'male') {
        const mp = maleMap.get(candidate.id);
        if (!mp) return false;
        if (filters.maleReviewedOnly && mp.maleReviewStatus !== 'approved') return false;
        if (filters.incomeVerifiedOnly && !mp.incomeVerified) return false;
        if (filters.facePhotoOnly && !mp.facePhotoVerified) return false;
        if (filters.maritalFilter === 'single_only' && mp.maritalStatus !== 'single') return false;
        if (filters.maritalFilter === 'include_married' && mp.maritalStatus === 'partner') return false;
        if (filters.job && !mp.job.includes(filters.job)) return false;
        if (filters.smoking && mp.smoking !== filters.smoking) return false;
        if (filters.drinking && mp.drinking !== filters.drinking) return false;
        if (filters.heightMin > 0 && mp.height < filters.heightMin) return false;
        if (filters.incomeMin && mp.income < filters.incomeMin) return false;
        return true;
      }
      const fp = femaleMap.get(candidate.id);
      if (filters.verifiedOnly && candidate.verificationStatus !== 'approved') return false;
      return fp?.nurseVerificationStatus === 'approved';
    })
    .sort((a, b) => {
      const aSignal = signalTargetSet.has(a.id) ? 1 : 0;
      const bSignal = signalTargetSet.has(b.id) ? 1 : 0;
      if (aSignal !== bSignal) return bSignal - aSignal;
      return sortByRecommendationPriority(user, a, b);
    });

  const relationshipFiltered: AppUser[] = [];
  for (const candidate of filtered) {
    if (!(await hasAnyRelationshipMode(candidate.id))) {
      relationshipFiltered.push(candidate);
    }
  }

  return Promise.all(
    relationshipFiltered.map(async (candidate) => ({
      user: await resolveProfileImage({
        ...candidate,
        profileImageUrl:
          (await getProfileImagesByUserId(candidate.id)).find((img) => img.isMain)?.imageUrl ?? candidate.profileImageUrl,
      }),
      maleProfile: maleMap.get(candidate.id) ?? null,
      femaleProfile: femaleMap.get(candidate.id) ?? null,
      profileImages: await getProfileImagesByUserId(candidate.id),
    })),
  );
}

type DailyRecommendationCard = {
  recommendation: DailyRecommendationRecord;
  user: AppUser;
  maleProfile: MaleProfile | null;
  femaleProfile: FemaleProfile | null;
  profileImages: ProfileImageRecord[];
};

function sortByRecommendationPriority(baseUser: AppUser, a: AppUser, b: AppUser) {
  const locationScoreA = a.location === baseUser.location ? 0 : 1;
  const locationScoreB = b.location === baseUser.location ? 0 : 1;
  if (locationScoreA !== locationScoreB) return locationScoreA - locationScoreB;
  const ageDiffA = Math.abs(a.age - baseUser.age);
  const ageDiffB = Math.abs(b.age - baseUser.age);
  return ageDiffA - ageDiffB;
}

function maleProfileCompleteness(profile: MaleProfile | null) {
  if (!profile) return 0;
  const points = [
    profile.job,
    profile.income,
    profile.maritalStatus,
    profile.height > 0 ? '1' : '',
    profile.bodyType,
    profile.smoking,
    profile.drinking,
    profile.holiday,
    profile.personalityTags.length > 0 ? '1' : '',
  ].filter(Boolean).length;
  return points;
}

export async function generateDailyRecommendations(userId: string, recommendationDate = getJstDateString()) {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user || user.gender !== 'female') return [] as DailyRecommendationRecord[];
    const femaleProfile = getFemaleProfile(user.id);
    const filters = await getFemalePreferenceFiltersForUser();
    const blocked = new Set(listBlocksForUser(user.id).map((item) => item.blockedUserId));
    const swiped = new Set(listLikes().filter((item) => item.fromUserId === user.id).map((item) => item.toUserId));
    const activeSignals = listInterestSignalsForTarget(user.id).filter(
      (signal) => signal.signalType === 'interested' && signal.matchedPreference && signal.expiresAt > new Date().toISOString(),
    );
    const signalTargetSet = new Set(activeSignals.map((signal) => signal.userId));

    const candidates = listUsers()
      .filter((candidate) => candidate.id !== user.id)
      .filter((candidate) => candidate.verificationStatus === 'approved' && !candidate.isSuspended)
      .filter((candidate) => !blocked.has(candidate.id) && !isBlockedBetween(user.id, candidate.id))
      .filter((candidate) => !swiped.has(candidate.id))
      .filter((candidate) => !hasAnyRelationshipModeInMock(candidate.id))
      .filter((candidate) => {
        if (candidate.gender === 'male') {
          if (!canSeek(user, 'male')) return false;
          const mp = getMaleProfile(candidate.id);
          if (!mp || mp.maleReviewStatus !== 'approved') return false;
          return matchesFemalePreference({
            femaleUser: user,
            femaleProfile,
            maleUser: candidate,
            maleProfile: mp,
            filters,
          });
        }
        if (!canSeek(user, 'female')) return false;
        if (!canSeek(candidate, 'female')) return false;
        const fp = getFemaleProfile(candidate.id);
        return Boolean(fp && fp.nurseVerificationStatus === 'approved');
      })
      .sort((a, b) => {
        const aSignaled = signalTargetSet.has(a.id) ? 1 : 0;
        const bSignaled = signalTargetSet.has(b.id) ? 1 : 0;
        if (aSignaled !== bSignaled) return bSignaled - aSignaled;
        const aScore = maleProfileCompleteness(getMaleProfile(a.id));
        const bScore = maleProfileCompleteness(getMaleProfile(b.id));
        if (aScore !== bScore) return bScore - aScore;
        return sortByRecommendationPriority(user, a, b);
      })
      .slice(0, 10);

    const rows: DailyRecommendationRecord[] = candidates.map((candidate, idx) => ({
      id: `daily_${user.id}_${recommendationDate}_${idx + 1}`,
      userId: user.id,
      targetUserId: candidate.id,
      recommendationDate,
      rank: idx + 1,
      reason: signalTargetSet.has(candidate.id) ? 'あなたの希望条件に合う候補です' : recommendationReason(idx + 1),
      createdAt: new Date().toISOString(),
    }));
    replaceDailyRecommendations(user.id, recommendationDate, rows);
    return rows;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return [] as DailyRecommendationRecord[];
  const { data: userRow } = await admin.from('users').select('*').eq('id', userId).single();
  if (!userRow) return [] as DailyRecommendationRecord[];
  const user = mapUser(userRow);
  if (user.gender !== 'female') return [] as DailyRecommendationRecord[];

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [] as DailyRecommendationRecord[];
  const filters = await getFemalePreferenceFiltersForUser();
  const blockedSet = await getBlockedRelationSetForUser(userId);
  const { data: likedRows } = await supabase.from('likes').select('to_user_id').eq('from_user_id', userId);
  const swiped = new Set((likedRows ?? []).map((row) => row.to_user_id));

  const [{ data: usersRows }, { data: maleRows }, { data: femaleRows }, { data: signalRows }] = await Promise.all([
    supabase
      .from('public_user_cards')
      .select('*')
      .eq('verification_status', 'approved')
      .eq('is_suspended', false)
      .neq('id', userId),
    supabase.from('male_profile_public').select('*'),
    supabase.from('female_profile_public').select('*'),
    admin
      .from('interest_signals')
      .select('user_id,target_user_id,matched_preference,signal_type,expires_at')
      .eq('target_user_id', userId)
      .eq('signal_type', 'interested')
      .eq('matched_preference', true)
      .gte('expires_at', new Date().toISOString()),
  ]);
  const femaleSelfProfileRow = (femaleRows ?? []).find((row) => row.user_id === userId);
  const femaleSelfProfile: FemaleProfile | null = femaleSelfProfileRow
    ? {
        userId: femaleSelfProfileRow.user_id,
        nurseDocumentUrl: '',
        nurseVerificationStatus: femaleSelfProfileRow.nurse_verification_status,
        workplaceType: femaleSelfProfileRow.workplace_type,
        hasNightShift: femaleSelfProfileRow.has_night_shift,
      }
    : null;
  const maleMap = new Map((maleRows ?? []).map((row) => [row.user_id, row]));
  const femaleMap = new Map((femaleRows ?? []).map((row) => [row.user_id, row]));
  const signalTargetSet = new Set((signalRows ?? []).map((row) => row.user_id));

  const filtered = (usersRows ?? [])
    .map((row) => mapPublicUserCard(row))
    .filter((candidate) => !blockedSet.has(candidate.id))
    .filter((candidate) => !swiped.has(candidate.id))
    .filter((candidate) => {
      if (candidate.gender === 'male') {
          if (!canSeek(user, 'male')) return false;
        const mpRow = maleMap.get(candidate.id);
        if (!mpRow || mpRow.male_review_status !== 'approved') return false;
        const maleProfile: MaleProfile = {
          userId: mpRow.user_id,
          job: mpRow.job,
          income: mpRow.income,
          maritalStatus: mpRow.marital_status,
          hasChildren: mpRow.has_children,
          maleReviewStatus: mpRow.male_review_status,
          incomeVerified: mpRow.income_verified,
          facePhotoVerified: mpRow.face_photo_verified,
          internalMemo: null,
          height: mpRow.height ?? 170,
          bodyType: mpRow.body_type ?? '',
          holiday: mpRow.holiday ?? '',
          smoking: mpRow.smoking ?? '',
          drinking: mpRow.drinking ?? '',
          nightShiftUnderstanding: mpRow.night_shift_understanding,
          shiftWorkUnderstanding: mpRow.shift_work_understanding,
          lateNightContactOk: mpRow.late_night_contact_ok,
          firstDateCost: mpRow.first_date_cost ?? '',
          personalityTags: mpRow.personality_tags ?? [],
        };
        return matchesFemalePreference({
          femaleUser: user,
          femaleProfile: femaleSelfProfile,
          maleUser: candidate,
          maleProfile,
          filters,
        });
      }
        if (!canSeek(user, 'female')) return false;
        if (!canSeek(candidate, 'female')) return false;
      const fp = femaleMap.get(candidate.id);
      return Boolean(fp && fp.nurse_verification_status === 'approved');
    });

  const picked: AppUser[] = [];
  for (
    const candidate of filtered.sort((a, b) => {
      const aSignaled = signalTargetSet.has(a.id) ? 1 : 0;
      const bSignaled = signalTargetSet.has(b.id) ? 1 : 0;
      if (aSignaled !== bSignaled) return bSignaled - aSignaled;
      const aScore = maleProfileCompleteness(
        a.gender === 'male' && maleMap.get(a.id)
          ? {
              userId: a.id,
              job: maleMap.get(a.id)?.job ?? '',
              income: maleMap.get(a.id)?.income ?? '',
              maritalStatus: maleMap.get(a.id)?.marital_status ?? 'single',
              hasChildren: maleMap.get(a.id)?.has_children ?? false,
              maleReviewStatus: maleMap.get(a.id)?.male_review_status ?? 'pending',
              incomeVerified: maleMap.get(a.id)?.income_verified ?? false,
              facePhotoVerified: maleMap.get(a.id)?.face_photo_verified ?? false,
              internalMemo: null,
              height: maleMap.get(a.id)?.height ?? 170,
              bodyType: maleMap.get(a.id)?.body_type ?? '',
              holiday: maleMap.get(a.id)?.holiday ?? '',
              smoking: maleMap.get(a.id)?.smoking ?? '',
              drinking: maleMap.get(a.id)?.drinking ?? '',
              nightShiftUnderstanding: maleMap.get(a.id)?.night_shift_understanding ?? false,
              shiftWorkUnderstanding: maleMap.get(a.id)?.shift_work_understanding ?? false,
              lateNightContactOk: maleMap.get(a.id)?.late_night_contact_ok ?? false,
              firstDateCost: maleMap.get(a.id)?.first_date_cost ?? '',
              personalityTags: maleMap.get(a.id)?.personality_tags ?? [],
            }
          : null,
      );
      const bScore = maleProfileCompleteness(
        b.gender === 'male' && maleMap.get(b.id)
          ? {
              userId: b.id,
              job: maleMap.get(b.id)?.job ?? '',
              income: maleMap.get(b.id)?.income ?? '',
              maritalStatus: maleMap.get(b.id)?.marital_status ?? 'single',
              hasChildren: maleMap.get(b.id)?.has_children ?? false,
              maleReviewStatus: maleMap.get(b.id)?.male_review_status ?? 'pending',
              incomeVerified: maleMap.get(b.id)?.income_verified ?? false,
              facePhotoVerified: maleMap.get(b.id)?.face_photo_verified ?? false,
              internalMemo: null,
              height: maleMap.get(b.id)?.height ?? 170,
              bodyType: maleMap.get(b.id)?.body_type ?? '',
              holiday: maleMap.get(b.id)?.holiday ?? '',
              smoking: maleMap.get(b.id)?.smoking ?? '',
              drinking: maleMap.get(b.id)?.drinking ?? '',
              nightShiftUnderstanding: maleMap.get(b.id)?.night_shift_understanding ?? false,
              shiftWorkUnderstanding: maleMap.get(b.id)?.shift_work_understanding ?? false,
              lateNightContactOk: maleMap.get(b.id)?.late_night_contact_ok ?? false,
              firstDateCost: maleMap.get(b.id)?.first_date_cost ?? '',
              personalityTags: maleMap.get(b.id)?.personality_tags ?? [],
            }
          : null,
      );
      if (aScore !== bScore) return bScore - aScore;
      return sortByRecommendationPriority(user, a, b);
    })
  ) {
    if (picked.length >= 10) break;
    if (await hasAnyRelationshipMode(candidate.id)) continue;
    picked.push(candidate);
  }

  await admin.from('daily_recommendations').delete().eq('user_id', userId).eq('recommendation_date', recommendationDate);
  if (picked.length === 0) return [] as DailyRecommendationRecord[];
  const insertRows: Database['public']['Tables']['daily_recommendations']['Insert'][] = picked.map((candidate, idx) => ({
    user_id: userId,
    target_user_id: candidate.id,
    recommendation_date: recommendationDate,
    rank: idx + 1,
    reason: signalTargetSet.has(candidate.id) ? 'あなたの希望条件に合う候補です' : recommendationReason(idx + 1),
  }));
  await admin.from('daily_recommendations').insert(insertRows);
  const { data: savedRows } = await admin
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('recommendation_date', recommendationDate)
    .order('rank', { ascending: true });
  return (savedRows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    targetUserId: row.target_user_id,
    recommendationDate: row.recommendation_date,
    rank: row.rank,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function getDailyRecommendationCards(user: AppUser, recommendationDate = getJstDateString()) {
  if (user.gender !== 'female') return [] as DailyRecommendationCard[];

  let dailyRows: DailyRecommendationRecord[] = [];
  if (USE_MOCK_DATA) {
    dailyRows = listDailyRecommendations(user.id, recommendationDate);
    if (dailyRows.length === 0) {
      dailyRows = await generateDailyRecommendations(user.id, recommendationDate);
    }
    return dailyRows
      .map((row) => {
        const target = getUserById(row.targetUserId);
        if (!target) return null;
        const images = listProfileImages(target.id);
        return {
          recommendation: row,
          user: {
            ...target,
            profileImageUrl: images.find((img) => img.isMain)?.imageUrl ?? target.profileImageUrl,
          },
          maleProfile: getMaleProfile(target.id),
          femaleProfile: getFemaleProfile(target.id),
          profileImages: images,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [] as DailyRecommendationCard[];
  const admin = createAdminSupabaseClient();
  if (!admin) return [] as DailyRecommendationCard[];

  const { data: existingRows } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('recommendation_date', recommendationDate)
    .order('rank', { ascending: true });
  if (!existingRows || existingRows.length === 0) {
    await generateDailyRecommendations(user.id, recommendationDate);
  }
  const { data: rows } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('recommendation_date', recommendationDate)
    .order('rank', { ascending: true });
  const targetIds = (rows ?? []).map((row) => row.target_user_id);
  if (targetIds.length === 0) return [] as DailyRecommendationCard[];

  const [{ data: userRows }, { data: maleRows }, { data: femaleRows }] = await Promise.all([
    supabase.from('public_user_cards').select('*').in('id', targetIds),
    supabase.from('male_profile_public').select('*').in('user_id', targetIds),
    supabase.from('female_profile_public').select('*').in('user_id', targetIds),
  ]);
  const userMap = new Map(
    await Promise.all(
      (userRows ?? []).map(async (row) => {
        const mapped = mapPublicUserCard(row);
        const images = await getProfileImagesByUserId(mapped.id);
        return [
          mapped.id,
          {
            user: await resolveProfileImage({
              ...mapped,
              profileImageUrl: images.find((img) => img.isMain)?.imageUrl ?? mapped.profileImageUrl,
            }),
            images,
          },
        ] as const;
      }),
    ),
  );
  const maleMap = new Map(
    (maleRows ?? []).map((m) => [
      m.user_id,
      {
        userId: m.user_id,
        job: m.job,
        income: m.income,
        maritalStatus: m.marital_status,
        hasChildren: m.has_children,
        maleReviewStatus: m.male_review_status,
        incomeVerified: m.income_verified,
        facePhotoVerified: m.face_photo_verified,
        internalMemo: null,
        height: m.height ?? 170,
        bodyType: m.body_type ?? '',
        holiday: m.holiday ?? '',
        smoking: m.smoking ?? '',
        drinking: m.drinking ?? '',
        nightShiftUnderstanding: m.night_shift_understanding,
        shiftWorkUnderstanding: m.shift_work_understanding,
        lateNightContactOk: m.late_night_contact_ok,
        firstDateCost: m.first_date_cost ?? '',
        personalityTags: m.personality_tags ?? [],
      } satisfies MaleProfile,
    ]),
  );
  const femaleMap = new Map(
    (femaleRows ?? []).map((f) => [
      f.user_id,
      {
        userId: f.user_id,
        nurseDocumentUrl: '',
        nurseVerificationStatus: f.nurse_verification_status,
        workplaceType: f.workplace_type,
        hasNightShift: f.has_night_shift,
      } satisfies FemaleProfile,
    ]),
  );

  return (rows ?? [])
    .map((row) => {
      const mapped = userMap.get(row.target_user_id);
      if (!mapped) return null;
      return {
        recommendation: {
          id: row.id,
          userId: row.user_id,
          targetUserId: row.target_user_id,
          recommendationDate: row.recommendation_date,
          rank: row.rank,
          reason: row.reason,
          createdAt: row.created_at,
        },
        user: mapped.user,
        maleProfile: maleMap.get(row.target_user_id) ?? null,
        femaleProfile: femaleMap.get(row.target_user_id) ?? null,
        profileImages: mapped.images,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export async function getMaleDailyCandidateCards(user: AppUser) {
  if (user.gender !== 'male') return [];
  const today = getJstDateString();

  if (USE_MOCK_DATA) {
    const blocked = new Set(listBlocksForUser(user.id).map((b) => b.blockedUserId));
    const signaledToday = listInterestSignalsByUser(user.id).filter((s) => isSameJstDate(s.createdAt, today));
    const signaledSet = new Set(signaledToday.map((s) => s.targetUserId));
    return listUsers()
      .filter((candidate) => candidate.id !== user.id && candidate.gender === 'female')
      .filter((candidate) => canSeek(candidate, 'male'))
      .filter((candidate) => candidate.verificationStatus === 'approved' && !candidate.isSuspended)
      .filter((candidate) => !blocked.has(candidate.id) && !isBlockedBetween(user.id, candidate.id))
      .filter((candidate) => !hasAnyRelationshipModeInMock(candidate.id))
      .map((candidate) => ({
        user: {
          ...candidate,
          profileImageUrl: listProfileImages(candidate.id).find((img) => img.isMain)?.imageUrl ?? candidate.profileImageUrl,
        },
        femaleProfile: getFemaleProfile(candidate.id),
        profileImages: listProfileImages(candidate.id),
        signaledToday: signaledSet.has(candidate.id),
      }))
      .slice(0, 3);
  }

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  if (!supabase || !admin) return [];
  const blockedSet = await getBlockedRelationSetForUser(user.id);
  const [{ data: femaleUsers }, { data: femaleProfiles }, { data: signalRows }] = await Promise.all([
    supabase
      .from('public_user_cards')
      .select('*')
      .eq('gender', 'female')
      .eq('verification_status', 'approved')
      .eq('is_suspended', false)
      .neq('id', user.id),
    supabase.from('female_profile_public').select('*'),
    admin
      .from('interest_signals')
      .select('target_user_id,created_at')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00+09:00`)
      .lte('created_at', `${today}T23:59:59+09:00`),
  ]);
  const signaledSet = new Set((signalRows ?? []).map((row) => row.target_user_id));
  const femaleMap = new Map(
    (femaleProfiles ?? []).map((f) => [
      f.user_id,
      {
        userId: f.user_id,
        nurseDocumentUrl: '',
        nurseVerificationStatus: f.nurse_verification_status,
        workplaceType: f.workplace_type,
        hasNightShift: f.has_night_shift,
      } satisfies FemaleProfile,
    ]),
  );

  const result: Array<{
    user: AppUser;
    femaleProfile: FemaleProfile | null;
    profileImages: ProfileImageRecord[];
    signaledToday: boolean;
  }> = [];
  for (const row of femaleUsers ?? []) {
    const mapped = mapPublicUserCard(row);
    if (!canSeek(mapped, 'male')) continue;
    if (blockedSet.has(mapped.id)) continue;
    if (await hasAnyRelationshipMode(mapped.id)) continue;
    const profileImages = await getProfileImagesByUserId(mapped.id);
    result.push({
      user: await resolveProfileImage({
        ...mapped,
        profileImageUrl: profileImages.find((img) => img.isMain)?.imageUrl ?? mapped.profileImageUrl,
      }),
      femaleProfile: femaleMap.get(mapped.id) ?? null,
      profileImages,
      signaledToday: signaledSet.has(mapped.id),
    });
    if (result.length >= 3) break;
  }
  return result;
}

export async function createInterestSignal(input: { userId: string; targetUserId: string; signalType: InterestSignalType }) {
  const now = new Date();
  const today = getJstDateString(now);
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (USE_MOCK_DATA) {
    const user = getUserById(input.userId);
    const target = getUserById(input.targetUserId);
    const maleProfile = user ? getMaleProfile(user.id) : null;
    const femaleProfile = target ? getFemaleProfile(target.id) : null;
    if (!user || !target || user.gender !== 'male' || target.gender !== 'female') throw new Error('対象ユーザーが不正です');
    if (user.isSuspended || user.verificationStatus !== 'approved' || user.onboardingStatus !== 'verified') {
      throw new Error('本人確認済みユーザーのみ利用できます');
    }
    if (!maleProfile || maleProfile.maleReviewStatus !== 'approved') throw new Error('男性審査通過後に利用できます');
    if (target.verificationStatus !== 'approved' || target.isSuspended) throw new Error('対象ユーザーに送信できません');
    if (!canSeek(target, 'male')) throw new Error('対象ユーザーの希望条件により送信できません');

    const todaySignals = listInterestSignalsByUser(user.id).filter((item) => isSameJstDate(item.createdAt, today));
    const alreadyToday = todaySignals.some((item) => item.targetUserId === target.id);
    if (alreadyToday) throw new Error('同じ相手には1日1回までです');
    if (input.signalType === 'interested' && todaySignals.filter((item) => item.signalType === 'interested').length >= 3) {
      throw new Error('1日の興味ありは最大3人までです');
    }

    const filters = DEFAULT_FEMALE_FILTERS;
    const matchedPreference = matchesFemalePreference({
      femaleUser: target,
      femaleProfile,
      maleUser: user,
      maleProfile,
      filters,
    });
    const reason = matchedPreference ? '希望条件に合う候補' : '条件不一致';
    return upsertInterestSignal({
      userId: user.id,
      targetUserId: target.id,
      signalType: input.signalType,
      matchedPreference,
      reason,
      expiresAt,
    });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');
  const [{ data: userRow }, { data: targetRow }] = await Promise.all([
    admin.from('users').select('*').eq('id', input.userId).single(),
    admin.from('users').select('*').eq('id', input.targetUserId).single(),
  ]);
  if (!userRow || !targetRow || userRow.gender !== 'male' || targetRow.gender !== 'female') {
    throw new Error('対象ユーザーが不正です');
  }
  const user = mapUser(userRow);
  const target = mapUser(targetRow);
  const [{ data: maleRow }, { data: femaleRow }] = await Promise.all([
    admin.from('male_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('female_profiles').select('*').eq('user_id', target.id).maybeSingle(),
  ]);
  const maleProfile = maleRow ? mapMale(maleRow) : null;
  const femaleProfile = femaleRow ? mapFemale(femaleRow) : null;
  if (user.isSuspended || user.verificationStatus !== 'approved' || user.onboardingStatus !== 'verified') {
    throw new Error('本人確認済みユーザーのみ利用できます');
  }
  if (!maleProfile || maleProfile.maleReviewStatus !== 'approved') throw new Error('男性審査通過後に利用できます');
  if (target.verificationStatus !== 'approved' || target.isSuspended) throw new Error('対象ユーザーに送信できません');
  if (!canSeek(target, 'male')) throw new Error('対象ユーザーの希望条件により送信できません');
  const { data: todaySignals } = await admin
    .from('interest_signals')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00+09:00`)
    .lte('created_at', `${today}T23:59:59+09:00`);
  if ((todaySignals ?? []).some((row) => row.target_user_id === target.id)) {
    throw new Error('同じ相手には1日1回までです');
  }
  if (input.signalType === 'interested' && (todaySignals ?? []).filter((row) => row.signal_type === 'interested').length >= 3) {
    throw new Error('1日の興味ありは最大3人までです');
  }

  const filters = DEFAULT_FEMALE_FILTERS;
  const matchedPreference = matchesFemalePreference({
    femaleUser: target,
    femaleProfile,
    maleUser: user,
    maleProfile,
    filters,
  });
  const reason = matchedPreference ? '希望条件に合う候補' : '条件不一致';
  await admin.from('interest_signals').insert({
    user_id: user.id,
    target_user_id: target.id,
    signal_type: input.signalType,
    matched_preference: matchedPreference,
    reason,
    expires_at: expiresAt,
  });
}

export async function swipe(fromUserId: string, toUserId: string, action: 'like' | 'skip') {
  if (USE_MOCK_DATA) {
    const from = getUserById(fromUserId);
    const to = getUserById(toUserId);
    if (!from || !to || from.gender === 'male' || isBlockedBetween(fromUserId, toUserId)) return;
    if (from.onboardingStatus !== 'verified' || to.onboardingStatus !== 'verified') return;
    if (hasAnyRelationshipModeInMock(fromUserId) || hasAnyRelationshipModeInMock(toUserId)) return;

    addLike(fromUserId, toUserId, action);

    if (action !== 'like') return;
    if (to.gender === 'male') {
      const match = ensureMatch(fromUserId, toUserId);
      const signal = listInterestSignalsByUser(toUserId).find(
        (item) =>
          item.targetUserId === fromUserId &&
          item.signalType === 'interested' &&
          item.matchedPreference &&
          item.expiresAt > new Date().toISOString(),
      );
      if (signal && match) {
        await consumeCredit({
          userId: toUserId,
          amount: 1,
          reason: '興味あり成立',
          relatedMatchId: match.id,
        });
      }
      return;
    }

    const hasReverseLike = listLikes().some(
      (item) => item.fromUserId === toUserId && item.toUserId === fromUserId && item.status === 'like',
    );

    if (hasReverseLike) {
      ensureMatch(fromUserId, toUserId);
    }
    return;
  }

  if (await isBlockedBetweenUsers(fromUserId, toUserId)) {
    throw new Error('ブロック関係のユーザーには操作できません');
  }
  if ((await hasAnyRelationshipMode(fromUserId)) || (await hasAnyRelationshipMode(toUserId))) {
    throw new Error('関係成立モードのユーザーは新規Likeできません');
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: fromUserRow } = await supabase
    .from('users')
    .select('gender,onboarding_status')
    .eq('id', fromUserId)
    .single();
  if (!fromUserRow || fromUserRow.gender !== 'female' || fromUserRow.onboarding_status !== 'verified') {
    throw new Error('男性ユーザーはスワイプできません');
  }

  await supabase.from('likes').upsert({ from_user_id: fromUserId, to_user_id: toUserId, status: action });
  if (action !== 'like') return;

  const { data: toUserRow } = await supabase.from('users').select('gender,onboarding_status').eq('id', toUserId).single();
  if (!toUserRow) return;
  if (toUserRow.onboarding_status !== 'verified') return;

  if (toUserRow.gender === 'male') {
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a_id.eq.${fromUserId},user_b_id.eq.${toUserId}),and(user_a_id.eq.${toUserId},user_b_id.eq.${fromUserId})`)
      .maybeSingle();

    let matchId: string | null = existing?.id ?? null;
    if (!existing) {
      await supabase
        .from('matches')
        .insert({ user_a_id: fromUserId, user_b_id: toUserId, relationship_status: 'active', hold_deletion: false });
      const { data: created } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_a_id.eq.${fromUserId},user_b_id.eq.${toUserId}),and(user_a_id.eq.${toUserId},user_b_id.eq.${fromUserId})`)
        .maybeSingle();
      matchId = created?.id ?? null;
    }
    const admin = createAdminSupabaseClient();
    if (admin) {
      const { data: signal } = await admin
        .from('interest_signals')
        .select('id')
        .eq('user_id', toUserId)
        .eq('target_user_id', fromUserId)
        .eq('signal_type', 'interested')
        .eq('matched_preference', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (signal) {
        await consumeCredit({
          userId: toUserId,
          amount: 1,
          reason: '興味あり成立',
          relatedMatchId: matchId,
        });
      }
    }
    return;
  }

  const { data: reverseLike } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .eq('status', 'like')
    .maybeSingle();

  if (reverseLike) {
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a_id.eq.${fromUserId},user_b_id.eq.${toUserId}),and(user_a_id.eq.${toUserId},user_b_id.eq.${fromUserId})`)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from('matches')
        .insert({ user_a_id: fromUserId, user_b_id: toUserId, relationship_status: 'active', hold_deletion: false });
    }
  }
}

export async function getFavoriteTargetIds(userId: string) {
  if (USE_MOCK_DATA) {
    return new Set(listFavorites(userId).map((row) => row.targetUserId));
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Set<string>();
  const { data } = await supabase.from('favorites').select('target_user_id').eq('user_id', userId);
  return new Set((data ?? []).map((row) => row.target_user_id));
}

export async function toggleFavoriteCandidate(userId: string, targetUserId: string) {
  if (USE_MOCK_DATA) {
    return toggleFavorite(userId, targetUserId);
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('target_user_id', targetUserId)
    .maybeSingle();
  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return false;
  }
  await supabase.from('favorites').insert({ user_id: userId, target_user_id: targetUserId });
  return true;
}

export async function getFavoriteCards(userId: string) {
  if (USE_MOCK_DATA) {
    const favoriteRows = listFavorites(userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return favoriteRows
      .map((row) => {
        const user = getUserById(row.targetUserId);
        if (!user) return null;
        const mainImage = listProfileImages(user.id).find((img) => img.isMain)?.imageUrl ?? user.profileImageUrl;
        return {
          favorite: row,
          user: {
            ...user,
            profileImageUrl: mainImage,
          },
          maleProfile: getMaleProfile(user.id),
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data: favoriteRows } = await supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  const targetIds = (favoriteRows ?? []).map((row) => row.target_user_id);
  if (targetIds.length === 0) return [];

  const [{ data: usersRows }, { data: malesRows }] = await Promise.all([
    supabase.from('public_user_cards').select('*').in('id', targetIds),
    supabase.from('male_profile_public').select('*').in('user_id', targetIds),
  ]);
  const userMap = new Map(
    await Promise.all(
      (usersRows ?? []).map(async (row) => {
        const mapped = mapPublicUserCard(row);
        const profileImages = await getProfileImagesByUserId(mapped.id);
        return [
          mapped.id,
          await resolveProfileImage({
            ...mapped,
            profileImageUrl: profileImages.find((img) => img.isMain)?.imageUrl ?? mapped.profileImageUrl,
          }),
        ] as const;
      }),
    ),
  );
  const maleMap = new Map(
    (malesRows ?? []).map((m) => [
      m.user_id,
      {
        userId: m.user_id,
        job: m.job,
        income: m.income,
        maritalStatus: m.marital_status,
        hasChildren: m.has_children,
        maleReviewStatus: m.male_review_status,
        incomeVerified: m.income_verified,
        facePhotoVerified: m.face_photo_verified,
        internalMemo: null,
        height: m.height ?? 170,
        bodyType: m.body_type ?? '',
        holiday: m.holiday ?? '',
        smoking: m.smoking ?? '',
        drinking: m.drinking ?? '',
        nightShiftUnderstanding: m.night_shift_understanding,
        shiftWorkUnderstanding: m.shift_work_understanding,
        lateNightContactOk: m.late_night_contact_ok,
        firstDateCost: m.first_date_cost ?? '',
        personalityTags: m.personality_tags ?? [],
      } satisfies MaleProfile,
    ]),
  );

  return (favoriteRows ?? [])
    .map((row) => ({
      favorite: {
        id: row.id,
        userId: row.user_id,
        targetUserId: row.target_user_id,
        createdAt: row.created_at,
      },
      user: userMap.get(row.target_user_id) ?? null,
      maleProfile: maleMap.get(row.target_user_id) ?? null,
    }))
    .filter((row) => row.user !== null);
}

function buildRiskCheckSummary(nickname: string, birthdate: string) {
  const keywords = [`${nickname} ${birthdate}`, `${nickname} 事件`, `${nickname} 反社`];
  const riskWordDetected = /(暴力団|詐欺|制裁|反社|マネロン)/.test(nickname);
  return {
    searchKeywords: keywords,
    hitCount: riskWordDetected ? 1 : 0,
    sourceUrls: riskWordDetected ? ['https://example.com/review-required'] : [],
    status: (riskWordDetected ? 'review_required' : 'clear') as RiskCheckStatus,
    adminMemo: riskWordDetected
      ? '同姓同名候補を含むため手動確認が必要です。AIは断定しません。'
      : '重大な一致なし。最終判断は管理者が実施。',
  };
}

export async function runRiskCheckForUser(userId: string, adminUserId: string): Promise<RiskCheckRecord | null> {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user) return null;
    const now = new Date().toISOString();
    const summary = buildRiskCheckSummary(user.nickname, user.birthdate);
    const row: RiskCheckRecord = {
      id: `risk_${userId}`,
      userId,
      status: summary.status,
      searchedAt: now,
      searchKeywords: summary.searchKeywords,
      hitCount: summary.hitCount,
      sourceUrls: summary.sourceUrls,
      adminMemo: summary.adminMemo,
      finalDeciderId: summary.status === 'clear' ? adminUserId : null,
      decidedAt: summary.status === 'clear' ? now : null,
    };
    upsertRiskCheck(row);
    updateUser(userId, { riskCheckStatus: row.status });
    return row;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return null;
  const { data: user } = await admin.from('users').select('nickname,birthdate').eq('id', userId).single();
  if (!user) return null;
  const now = new Date().toISOString();
  const summary = buildRiskCheckSummary(user.nickname, user.birthdate);

  await admin.from('users').update({ risk_check_status: 'checking' }).eq('id', userId);
  const upsert: Database['public']['Tables']['risk_checks']['Insert'] = {
    user_id: userId,
    status: summary.status,
    searched_at: now,
    search_keywords: summary.searchKeywords,
    hit_count: summary.hitCount,
    source_urls: summary.sourceUrls,
    admin_memo: summary.adminMemo,
    final_decider_id: summary.status === 'clear' ? adminUserId : null,
    decided_at: summary.status === 'clear' ? now : null,
  };
  await admin.from('risk_checks').upsert(upsert, { onConflict: 'user_id' });
  await admin.from('users').update({ risk_check_status: summary.status }).eq('id', userId);

  const { data: saved } = await admin.from('risk_checks').select('*').eq('user_id', userId).single();
  if (!saved) return null;
  return {
    id: saved.id,
    userId: saved.user_id,
    status: saved.status,
    searchedAt: saved.searched_at,
    searchKeywords: saved.search_keywords,
    hitCount: saved.hit_count,
    sourceUrls: saved.source_urls,
    adminMemo: saved.admin_memo,
    finalDeciderId: saved.final_decider_id,
    decidedAt: saved.decided_at,
  };
}

export async function updateRiskCheckDetails(
  userId: string,
  status: Extract<RiskCheckStatus, 'clear' | 'review_required' | 'rejected'>,
  adminMemo: string,
  adminUserId: string,
) {
  const now = new Date().toISOString();
  if (USE_MOCK_DATA) {
    const before = getRiskCheck(userId);
    const next: RiskCheckRecord = {
      id: before?.id ?? `risk_${userId}`,
      userId,
      status,
      searchedAt: before?.searchedAt ?? now,
      searchKeywords: before?.searchKeywords ?? [],
      hitCount: before?.hitCount ?? 0,
      sourceUrls: before?.sourceUrls ?? [],
      adminMemo: adminMemo || before?.adminMemo || null,
      finalDeciderId: adminUserId,
      decidedAt: now,
    };
    upsertRiskCheck(next);
    updateUser(userId, { riskCheckStatus: status });
    return;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return;
  const { data: before } = await admin.from('risk_checks').select('*').eq('user_id', userId).maybeSingle();
  if (!before) {
    await admin.from('risk_checks').insert({
      user_id: userId,
      status,
      searched_at: now,
      search_keywords: [],
      hit_count: 0,
      source_urls: [],
      admin_memo: adminMemo || null,
      final_decider_id: adminUserId,
      decided_at: now,
    });
  } else {
    await admin
      .from('risk_checks')
      .update({
        status,
        admin_memo: adminMemo || null,
        final_decider_id: adminUserId,
        decided_at: now,
      })
      .eq('user_id', userId);
  }
  await admin.from('users').update({ risk_check_status: status }).eq('id', userId);

  const beforeStatus = before?.status;
  if (beforeStatus !== status) {
    await admin.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      target_user_id: userId,
      action: status === 'clear' ? 'approve' : 'reject',
      reason: `riskCheckStatus: ${beforeStatus ?? 'none'} -> ${status}`,
    });
  }
}

export async function getRiskCheckByUserId(userId: string): Promise<RiskCheckRecord | null> {
  if (USE_MOCK_DATA) return getRiskCheck(userId);
  const admin = createAdminSupabaseClient();
  if (!admin) return null;
  const { data } = await admin.from('risk_checks').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    searchedAt: data.searched_at,
    searchKeywords: data.search_keywords,
    hitCount: data.hit_count,
    sourceUrls: data.source_urls,
    adminMemo: data.admin_memo,
    finalDeciderId: data.final_decider_id,
    decidedAt: data.decided_at,
  };
}

export async function getMatches(userId: string) {
  if (USE_MOCK_DATA) {
    return listMatchesForUser(userId)
      .filter((match) => match.relationshipStatus !== 'deleted')
      .map((match) => {
        const partnerId = match.userAId === userId ? match.userBId : match.userAId;
        return {
          match,
          partner: getUserById(partnerId),
        };
      })
      .filter(({ partner }) => partner && !isBlockedBetween(userId, partner.id));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const blockedSet = await getBlockedRelationSetForUser(userId);

  const { data: rows } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const allPartnerIds = (rows ?? [])
    .map((m) => (m.user_a_id === userId ? m.user_b_id : m.user_a_id))
    .filter((partnerId) => !blockedSet.has(partnerId));

  const { data: usersRows } = await supabase.from('public_user_cards').select('*').in('id', allPartnerIds);
  const userMap = new Map(
    await Promise.all(
      (usersRows ?? []).map(async (u) => {
        const mapped = await resolveProfileImage(mapPublicUserCard(u));
        return [u.id, mapped] as const;
      }),
    ),
  );

  return (rows ?? [])
    .filter((row) => row.relationship_status !== 'deleted')
    .map((row) => {
      const partnerId = row.user_a_id === userId ? row.user_b_id : row.user_a_id;
      return {
        match: {
          id: row.id,
          userAId: row.user_a_id,
          userBId: row.user_b_id,
          relationshipStatus: row.relationship_status,
          relationshipStartedAt: row.relationship_started_at,
          scheduledDeleteAt: row.scheduled_delete_at,
          holdDeletion: row.hold_deletion,
          createdAt: row.created_at,
        },
        partner: userMap.get(partnerId) ?? null,
      };
    })
    .filter((entry) => entry.partner !== null);
}

export async function getChat(matchId: string) {
  if (USE_MOCK_DATA) {
    const match = getMatchById(matchId);
    if (match && isBlockedBetween(match.userAId, match.userBId)) {
      return { match: null, messages: [] };
    }
    if (match?.relationshipStatus === 'deleted' || match?.relationshipStatus === 'relationship_mode') {
      return { match: null, messages: [] };
    }
    if (match) {
      const canA = await canUseChatByUser(match.userAId);
      const canB = await canUseChatByUser(match.userBId);
      if (!canA || !canB) return { match: null, messages: [] };
    }

    return {
      match,
      messages: listMessages(matchId),
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { match: null, messages: [] };

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (match) {
    const blocked = await isBlockedBetweenUsers(match.user_a_id, match.user_b_id);
    if (blocked) return { match: null, messages: [] };
    if (match.relationship_status !== 'active') return { match: null, messages: [] };
    const canA = await canUseChatByUser(match.user_a_id);
    const canB = await canUseChatByUser(match.user_b_id);
    if (!canA || !canB) return { match: null, messages: [] };
  }

  const { data: messages } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at');

  return {
    match: match
      ? {
          id: match.id,
          userAId: match.user_a_id,
          userBId: match.user_b_id,
          relationshipStatus: match.relationship_status,
          relationshipStartedAt: match.relationship_started_at,
          scheduledDeleteAt: match.scheduled_delete_at,
          holdDeletion: match.hold_deletion,
          createdAt: match.created_at,
        }
      : null,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      matchId: m.match_id,
      senderId: m.sender_id,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export async function sendMessage(matchId: string, senderId: string, body: string) {
  if (USE_MOCK_DATA) {
    const match = getMatchById(matchId);
    if (!match || isBlockedBetween(match.userAId, match.userBId)) return;
    const sender = getUserById(senderId);
    if (!sender || sender.onboardingStatus !== 'verified') return;
    const canA = await canUseChatByUser(match.userAId);
    const canB = await canUseChatByUser(match.userBId);
    if (!canA || !canB) {
      throw new Error('審査条件を満たすユーザーのみチャット利用できます');
    }
    if (match.relationshipStatus !== 'active') {
      throw new Error('成立済みマッチはチャット送信できません');
    }
    addMessage(matchId, senderId, body);
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: match } = await supabase
    .from('matches')
    .select('user_a_id,user_b_id,relationship_status')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) return;
  const { data: sender } = await supabase.from('users').select('onboarding_status').eq('id', senderId).single();
  if (!sender || sender.onboarding_status !== 'verified') {
    throw new Error('本人確認完了後にメッセージ送信できます');
  }
  if (!isMatchActive(match)) {
    throw new Error('成立済みマッチはチャット送信できません');
  }
  const canA = await canUseChatByUser(match.user_a_id);
  const canB = await canUseChatByUser(match.user_b_id);
  if (!canA || !canB) {
    throw new Error('審査条件を満たすユーザーのみチャット利用できます');
  }

  const blocked = await isBlockedBetweenUsers(match.user_a_id, match.user_b_id);
  if (blocked) {
    throw new Error('ブロック関係のためメッセージ送信できません');
  }

  await supabase.from('messages').insert({ match_id: matchId, sender_id: senderId, body });
}

export async function getBlockedUsers(userId: string) {
  if (USE_MOCK_DATA) {
    return listBlocksForUser(userId)
      .map((b) => ({
        block: b,
        blockedUser: getUserById(b.blockedUserId),
      }))
      .filter((item) => item.blockedUser !== null);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: blocks } = await supabase.from('blocks').select('*').eq('blocker_user_id', userId).order('created_at', { ascending: false });
  const ids = (blocks ?? []).map((b) => b.blocked_user_id);
  if (ids.length === 0) return [];

  const { data: users } = await supabase.from('public_user_cards').select('*').in('id', ids);
  const userMap = new Map(
    await Promise.all((users ?? []).map(async (u) => [u.id, await resolveProfileImage(mapPublicUserCard(u))] as const)),
  );

  return (blocks ?? []).map((block) => ({
    block: {
      id: block.id,
      blockerUserId: block.blocker_user_id,
      blockedUserId: block.blocked_user_id,
      createdAt: block.created_at,
    },
    blockedUser: userMap.get(block.blocked_user_id) ?? null,
  }));
}

export async function blockUser(blockerUserId: string, blockedUserId: string) {
  if (USE_MOCK_DATA) {
    addBlock(blockerUserId, blockedUserId);
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from('blocks').upsert({ blocker_user_id: blockerUserId, blocked_user_id: blockedUserId });
}

export async function getAdminData(adminUserId?: string) {
  if (USE_MOCK_DATA) {
    const relationshipMatches = listUsers()
      .flatMap((u) => listMatchesForUser(u.id))
      .filter((match, index, arr) => arr.findIndex((m) => m.id === match.id) === index)
      .filter((match) => match.relationshipStatus !== 'active');
    return {
      users: listUsers(),
      reports: listReports(),
      femaleProfiles: listUsers()
        .filter((user) => user.gender === 'female')
        .map((user) => ({ userId: user.id, profile: getFemaleProfile(user.id) })),
      maleProfiles: listUsers()
        .filter((user) => user.gender === 'male')
        .map((user) => ({ userId: user.id, profile: getMaleProfile(user.id) })),
      adminActions: listAdminActions(),
      riskChecks: listUsers().map((user) => getRiskCheck(user.id)).filter(Boolean),
      relationshipMatches,
    };
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');

  const [{ data: usersRows }, { data: reportRows }, { data: femaleRows }, { data: maleRows }, { data: actionRows }, { data: matchRows }, { data: riskRows }] =
    await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('female_profiles').select('*'),
      supabase.from('male_profiles').select('*'),
      supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('matches').select('*').in('relationship_status', ['relationship_mode', 'scheduled_delete']),
      supabase.from('risk_checks').select('*'),
    ]);

  const isAdmin = Boolean(adminUserId);

  const users = await Promise.all(
    (usersRows ?? []).map(async (row) => {
      const mapped = mapUser(row);
      return {
        ...mapped,
        profileImageUrl: (await getSignedProfileImageUrl(mapped.profileImageUrl)) ?? mapped.profileImageUrl,
        identityDocumentUrl: await getAdminSignedDocumentUrl(mapped.identityDocumentUrl, isAdmin),
      };
    }),
  );

  const femaleProfiles = await Promise.all(
    (femaleRows ?? []).map(async (f) => ({
      userId: f.user_id,
      profile: {
        ...mapFemale(f),
        nurseDocumentUrl: (await getAdminSignedDocumentUrl(f.nurse_document_url, isAdmin)) ?? '',
      },
    })),
  );

  return {
    users,
    reports: (reportRows ?? []).map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      targetUserId: r.target_user_id,
      reason: r.reason,
      reasonType: r.reason_type,
      detail: r.detail,
      status: r.status,
      createdAt: r.created_at,
    })),
    femaleProfiles,
    maleProfiles: (maleRows ?? []).map((m) => ({ userId: m.user_id, profile: mapMale(m) })),
    adminActions: (actionRows ?? []).map((a) => ({
      id: a.id,
      adminUserId: a.admin_user_id,
      targetUserId: a.target_user_id,
      actionType: a.action_type,
      beforeValue: a.before_value,
      afterValue: a.after_value,
      note: a.note,
      createdAt: a.created_at,
    })),
    riskChecks: (riskRows ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      searchedAt: row.searched_at,
      searchKeywords: row.search_keywords,
      hitCount: row.hit_count,
      sourceUrls: row.source_urls,
      adminMemo: row.admin_memo,
      finalDeciderId: row.final_decider_id,
      decidedAt: row.decided_at,
    })),
    relationshipMatches: (matchRows ?? []).map((m) => ({
      id: m.id,
      userAId: m.user_a_id,
      userBId: m.user_b_id,
      relationshipStatus: m.relationship_status,
      relationshipStartedAt: m.relationship_started_at,
      scheduledDeleteAt: m.scheduled_delete_at,
      holdDeletion: m.hold_deletion,
      createdAt: m.created_at,
    })),
  };
}

export async function updateVerification(
  userId: string,
  status: AppUser['verificationStatus'],
  rejectedReason: string | undefined,
  adminUserId: string,
) {
  if (USE_MOCK_DATA) {
    const before = getUserById(userId);
    updateUser(userId, { verificationStatus: status, rejectedReason: rejectedReason ?? null });
    addAdminAction({
      adminUserId,
      targetUserId: userId,
      actionType: 'verification_status_changed',
      beforeValue: before?.verificationStatus ?? null,
      afterValue: status,
      note: null,
    });
    if ((before?.rejectedReason ?? null) !== (rejectedReason ?? null)) {
      addAdminAction({
        adminUserId,
        targetUserId: userId,
        actionType: 'rejected_reason_updated',
        beforeValue: before?.rejectedReason ?? null,
        afterValue: rejectedReason ?? null,
        note: null,
      });
    }
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { data: before } = await supabase.from('users').select('verification_status,rejected_reason').eq('id', userId).single();
  await supabase.from('users').update({ verification_status: status, rejected_reason: rejectedReason ?? null }).eq('id', userId);

  await insertAdminActionLog({
    adminUserId,
    targetUserId: userId,
    actionType: 'verification_status_changed',
    beforeValue: before?.verification_status ?? null,
    afterValue: status,
  });

  if ((before?.rejected_reason ?? null) !== (rejectedReason ?? null)) {
    await insertAdminActionLog({
      adminUserId,
      targetUserId: userId,
      actionType: 'rejected_reason_updated',
      beforeValue: before?.rejected_reason ?? null,
      afterValue: rejectedReason ?? null,
    });
  }
}

export async function updateSuspended(userId: string, isSuspended: boolean, adminUserId: string) {
  if (USE_MOCK_DATA) {
    const before = getUserById(userId);
    updateUser(userId, { isSuspended });
    addAdminAction({
      adminUserId,
      targetUserId: userId,
      actionType: 'user_suspended',
      beforeValue: String(before?.isSuspended ?? false),
      afterValue: String(isSuspended),
      note: null,
    });
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { data: before } = await supabase.from('users').select('is_suspended').eq('id', userId).single();
  await supabase.from('users').update({ is_suspended: isSuspended }).eq('id', userId);

  await insertAdminActionLog({
    adminUserId,
    targetUserId: userId,
    actionType: 'user_suspended',
    beforeValue: String(before?.is_suspended ?? false),
    afterValue: String(isSuspended),
  });
}

export async function updateNurseVerification(userId: string, status: AppUser['verificationStatus'], adminUserId: string) {
  if (USE_MOCK_DATA) {
    const before = getFemaleProfile(userId);
    setNurseVerificationStatus(userId, status);
    addAdminAction({
      adminUserId,
      targetUserId: userId,
      actionType: 'nurse_verification_status_changed',
      beforeValue: before?.nurseVerificationStatus ?? null,
      afterValue: status,
      note: null,
    });
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { data: before } = await supabase
    .from('female_profiles')
    .select('nurse_verification_status')
    .eq('user_id', userId)
    .single();

  await supabase.from('female_profiles').update({ nurse_verification_status: status }).eq('user_id', userId);

  await insertAdminActionLog({
    adminUserId,
    targetUserId: userId,
    actionType: 'nurse_verification_status_changed',
    beforeValue: before?.nurse_verification_status ?? null,
    afterValue: status,
  });
}

export async function updateMaleReview(
  userId: string,
  status: MaleProfile['maleReviewStatus'],
  internalMemo: string,
  adminUserId: string,
) {
  if (USE_MOCK_DATA) {
    const before = getMaleProfile(userId);
    setMaleReviewStatus(userId, status, internalMemo);
    addAdminAction({
      adminUserId,
      targetUserId: userId,
      actionType: 'male_review_status_changed',
      beforeValue: before?.maleReviewStatus ?? null,
      afterValue: status,
      note: null,
    });
    if ((before?.internalMemo ?? null) !== (internalMemo || null)) {
      addAdminAction({
        adminUserId,
        targetUserId: userId,
        actionType: 'internal_memo_updated',
        beforeValue: before?.internalMemo ?? null,
        afterValue: internalMemo || null,
        note: null,
      });
    }
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { data: before } = await supabase
    .from('male_profiles')
    .select('male_review_status,internal_memo')
    .eq('user_id', userId)
    .single();

  await supabase
    .from('male_profiles')
    .update({ male_review_status: status, internal_memo: internalMemo || null })
    .eq('user_id', userId);

  await insertAdminActionLog({
    adminUserId,
    targetUserId: userId,
    actionType: 'male_review_status_changed',
    beforeValue: before?.male_review_status ?? null,
    afterValue: status,
  });

  if ((before?.internal_memo ?? null) !== (internalMemo || null)) {
    await insertAdminActionLog({
      adminUserId,
      targetUserId: userId,
      actionType: 'internal_memo_updated',
      beforeValue: before?.internal_memo ?? null,
      afterValue: internalMemo || null,
    });
  }
}

export async function updateUserModerationState(
  userId: string,
  moderationAction: ModerationAction,
  rejectedReason: string | null,
  adminUserId: string,
) {
  if (USE_MOCK_DATA) {
    const before = getUserById(userId);
    updateUserModeration(userId, moderationAction, rejectedReason);
    if (moderationAction === 'permanent_ban') {
      addAdminAction({
        adminUserId,
        targetUserId: userId,
        actionType: 'user_permanent_banned',
        beforeValue: before?.moderationAction ?? null,
        afterValue: moderationAction,
        note: rejectedReason,
      });
    }
    if ((before?.rejectedReason ?? null) !== rejectedReason) {
      addAdminAction({
        adminUserId,
        targetUserId: userId,
        actionType: 'rejected_reason_updated',
        beforeValue: before?.rejectedReason ?? null,
        afterValue: rejectedReason,
        note: null,
      });
    }
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { data: before } = await supabase
    .from('users')
    .select('moderation_action,rejected_reason')
    .eq('id', userId)
    .single();

  await supabase
    .from('users')
    .update({ moderation_action: moderationAction, rejected_reason: rejectedReason })
    .eq('id', userId);

  if (moderationAction === 'permanent_ban') {
    await insertAdminActionLog({
      adminUserId,
      targetUserId: userId,
      actionType: 'user_permanent_banned',
      beforeValue: before?.moderation_action ?? null,
      afterValue: moderationAction,
      note: rejectedReason,
    });
  }

  if ((before?.rejected_reason ?? null) !== rejectedReason) {
    await insertAdminActionLog({
      adminUserId,
      targetUserId: userId,
      actionType: 'rejected_reason_updated',
      beforeValue: before?.rejected_reason ?? null,
      afterValue: rejectedReason,
    });
  }
}

export async function updateReport(reportId: string, status: ReportStatus) {
  if (USE_MOCK_DATA) {
    const row = setReportStatus(reportId, status);
    if (row) await syncMatchDeletionHoldByUser(row.targetUserId);
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) return;
  const { data: before } = await supabase.from('reports').select('target_user_id').eq('id', reportId).single();
  await supabase.from('reports').update({ status }).eq('id', reportId);
  if (before?.target_user_id) await syncMatchDeletionHoldByUser(before.target_user_id);
}

export async function createReport(input: {
  reporterId: string;
  targetUserId: string;
  reason: string;
  reasonType: ReportReasonType;
  detail: string;
}) {
  if (USE_MOCK_DATA) {
    const report = addReport(input);
    await syncMatchDeletionHoldByUser(report.targetUserId);
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.from('reports').insert({
    reporter_id: input.reporterId,
    target_user_id: input.targetUserId,
    reason: input.reason,
    reason_type: input.reasonType,
    detail: input.detail,
  });
  await syncMatchDeletionHoldByUser(input.targetUserId);
}

async function hasOpenOrReviewingReports(userAId: string, userBId: string) {
  if (USE_MOCK_DATA) {
    return listReports().some(
      (report) =>
        (report.targetUserId === userAId || report.targetUserId === userBId) &&
        (report.status === 'open' || report.status === 'reviewing'),
    );
  }

  const supabase = await createAdminSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from('reports')
    .select('id')
    .in('target_user_id', [userAId, userBId])
    .in('status', ['open', 'reviewing'])
    .limit(1);
  return Boolean(data && data.length > 0);
}

async function syncMatchDeletionHoldByUser(userId: string) {
  if (USE_MOCK_DATA) {
    const hasOpen = listReports().some(
      (report) => report.targetUserId === userId && (report.status === 'open' || report.status === 'reviewing'),
    );
    listMatchesForUser(userId).forEach((match) => {
      if (match.relationshipStatus !== 'active') {
        updateMatch(match.id, { holdDeletion: hasOpen || match.holdDeletion });
      }
    });
    return;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return;
  const { data: hasOpenRows } = await admin
    .from('reports')
    .select('id')
    .eq('target_user_id', userId)
    .in('status', ['open', 'reviewing'])
    .limit(1);
  const hasOpen = Boolean(hasOpenRows && hasOpenRows.length > 0);

  const { data: matches } = await admin
    .from('matches')
    .select('id,hold_deletion')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .in('relationship_status', ['relationship_mode', 'scheduled_delete']);

  for (const match of matches ?? []) {
    await admin.from('matches').update({ hold_deletion: hasOpen || match.hold_deletion }).eq('id', match.id);
  }
}

export async function markMatchAsRelationshipMode(matchId: string, actorUserId: string) {
  const now = new Date();
  const startedAt = now.toISOString();
  const scheduledDeleteAt = new Date(now.getTime() + RELATIONSHIP_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  if (USE_MOCK_DATA) {
    const match = getMatchById(matchId);
    if (!match) throw new Error('マッチが見つかりません');
    if (match.userAId !== actorUserId && match.userBId !== actorUserId) throw new Error('権限がありません');

    const holdDeletion = await hasOpenOrReviewingReports(match.userAId, match.userBId);
    updateMatch(matchId, {
      relationshipStatus: 'relationship_mode',
      relationshipStartedAt: startedAt,
      scheduledDeleteAt,
      holdDeletion,
    });
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match) throw new Error('マッチが見つかりません');
  if (match.user_a_id !== actorUserId && match.user_b_id !== actorUserId) throw new Error('権限がありません');

  const holdDeletion = await hasOpenOrReviewingReports(match.user_a_id, match.user_b_id);
  await supabase
    .from('matches')
    .update({
      relationship_status: 'relationship_mode',
      relationship_started_at: startedAt,
      scheduled_delete_at: scheduledDeleteAt,
      hold_deletion: holdDeletion,
    })
    .eq('id', matchId);
}

export async function updateMatchHoldDeletion(matchId: string, holdDeletion: boolean, adminUserId?: string) {
  if (USE_MOCK_DATA) {
    updateMatch(matchId, { holdDeletion });
    return;
  }
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;
  const { data: before } = await supabase.from('matches').select('hold_deletion,user_a_id,user_b_id').eq('id', matchId).maybeSingle();
  await supabase.from('matches').update({ hold_deletion: holdDeletion }).eq('id', matchId);
  if (adminUserId && before && before.hold_deletion !== holdDeletion) {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      target_user_id: before.user_a_id,
      action: 'deletion_hold',
      reason: `match:${matchId} hold=${holdDeletion}`,
    });
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      target_user_id: before.user_b_id,
      action: 'deletion_hold',
      reason: `match:${matchId} hold=${holdDeletion}`,
    });
  }
}

export async function saveProfile(userId: string, form: Record<string, string>) {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user) return;

    const images = listProfileImages(userId);
    const hasProfileImage = Boolean(form.profileImageUrl || images.length > 0 || user.profileImageUrl);
    let onboardingStatus: OnboardingStatus = 'provisional';

    updateUser(userId, {
      nickname: form.nickname,
      location: form.location,
      bio: form.bio,
      desiredGender: user.gender === 'male' ? 'female' : ((form.desiredGender as AppUser['desiredGender']) ?? user.desiredGender),
      profileImageUrl: form.profileImageUrl || user.profileImageUrl,
    });

    if (user.gender === 'male') {
      const current = getMaleProfile(userId);
      upsertMaleProfile({
        userId,
        job: form.job,
        income: form.income,
        maritalStatus: (form.maritalStatus as MaritalStatus) ?? 'single',
        hasChildren: form.hasChildren === 'on',
        maleReviewStatus: current?.maleReviewStatus ?? 'pending',
        incomeVerified: current?.incomeVerified ?? false,
        facePhotoVerified: current?.facePhotoVerified ?? false,
        internalMemo: current?.internalMemo ?? null,
        height: Number(form.height) || 170,
        bodyType: form.bodyType,
        holiday: form.holiday,
        smoking: form.smoking,
        drinking: form.drinking,
        nightShiftUnderstanding: form.nightShiftUnderstanding === 'on',
        shiftWorkUnderstanding: form.shiftWorkUnderstanding === 'on',
        lateNightContactOk: form.lateNightContactOk === 'on',
        firstDateCost: form.firstDateCost || '',
        personalityTags: form.personalityTags ? form.personalityTags.split(',').map((item) => item.trim()).filter(Boolean) : [],
      });
      const hasRequired =
        hasProfileImage && Boolean(form.job) && Boolean(form.income) && Boolean(form.maritalStatus) && Boolean(form.bio);
      onboardingStatus = hasRequired ? 'profile_completed' : 'provisional';
    } else {
      const current = getFemaleProfile(userId);
      upsertFemaleProfile({
        userId,
        nurseDocumentUrl: form.nurseDocumentUrl || current?.nurseDocumentUrl || 'mock://nurse/new.pdf',
        nurseVerificationStatus: form.nurseDocumentUrl ? 'pending' : current?.nurseVerificationStatus ?? 'pending',
        workplaceType: (form.workplaceType as FemaleProfile['workplaceType']) ?? 'other',
        hasNightShift: form.hasNightShift === 'on',
      });
      const hasRequired = hasProfileImage && Boolean(form.desiredGender) && Boolean(form.workplaceType);
      onboardingStatus = hasRequired ? 'profile_completed' : 'provisional';
    }

    if (
      onboardingStatus === 'profile_completed' &&
      user.verificationStatus === 'approved' &&
      ((user.gender === 'female' && getFemaleProfile(userId)?.nurseVerificationStatus === 'approved') ||
        (user.gender === 'male' && getMaleProfile(userId)?.maleReviewStatus === 'approved'))
    ) {
      onboardingStatus = 'verified';
    }
    updateUser(userId, { onboardingStatus });
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: userRow } = await supabase
    .from('users')
    .select('gender, desired_gender, seeking_gender, verification_status, profile_image_url')
    .eq('id', userId)
    .single();
  if (!userRow) return;

  let onboardingStatus: OnboardingStatus = 'provisional';
  await supabase
    .from('users')
    .update({
      nickname: form.nickname,
      location: form.location,
      bio: form.bio,
      desired_gender: userRow.gender === 'male' ? 'female' : ((form.desiredGender as AppUser['desiredGender']) ?? userRow.desired_gender),
      seeking_gender: userRow.gender === 'male' ? 'female' : ((form.desiredGender as AppUser['desiredGender']) ?? userRow.seeking_gender),
      ...(form.profileImageUrl ? { profile_image_url: form.profileImageUrl } : {}),
    })
    .eq('id', userId);

  if (userRow.gender === 'male') {
    const { data: current } = await supabase.from('male_profiles').select('*').eq('user_id', userId).maybeSingle();
    await supabase.from('male_profiles').upsert({
      user_id: userId,
      job: form.job,
      income: form.income,
      marital_status: (form.maritalStatus as MaritalStatus) ?? 'single',
      has_children: form.hasChildren === 'on',
      male_review_status: current?.male_review_status ?? 'pending',
      income_verified: current?.income_verified ?? false,
      face_photo_verified: current?.face_photo_verified ?? false,
      internal_memo: current?.internal_memo ?? null,
      height: Number(form.height) || 170,
      body_type: form.bodyType,
      holiday: form.holiday,
      smoking: form.smoking,
      drinking: form.drinking,
      night_shift_understanding: form.nightShiftUnderstanding === 'on',
      shift_work_understanding: form.shiftWorkUnderstanding === 'on',
      late_night_contact_ok: form.lateNightContactOk === 'on',
      first_date_cost: form.firstDateCost || '',
      personality_tags: form.personalityTags ? form.personalityTags.split(',').map((item) => item.trim()).filter(Boolean) : [],
    });
    onboardingStatus =
      (form.profileImageUrl || userRow.profile_image_url) && form.job && form.income && form.maritalStatus && form.bio
        ? 'profile_completed'
        : 'provisional';
    const { data: mp } = await supabase.from('male_profiles').select('male_review_status').eq('user_id', userId).maybeSingle();
    if (onboardingStatus === 'profile_completed' && userRow.verification_status === 'approved' && mp?.male_review_status === 'approved') {
      onboardingStatus = 'verified';
    }
  } else {
    const { data: current } = await supabase.from('female_profiles').select('*').eq('user_id', userId).maybeSingle();
    await supabase.from('female_profiles').upsert({
      user_id: userId,
      nurse_document_url: form.nurseDocumentUrl || current?.nurse_document_url || '',
      nurse_verification_status: form.nurseDocumentUrl ? 'pending' : current?.nurse_verification_status ?? 'pending',
      workplace_type: (form.workplaceType as FemaleProfile['workplaceType']) ?? 'other',
      has_night_shift: form.hasNightShift === 'on',
    });
    onboardingStatus =
      (form.profileImageUrl || userRow.profile_image_url) && form.desiredGender && form.workplaceType
        ? 'profile_completed'
        : 'provisional';
    const { data: fp } = await supabase.from('female_profiles').select('nurse_verification_status').eq('user_id', userId).maybeSingle();
    if (onboardingStatus === 'profile_completed' && userRow.verification_status === 'approved' && fp?.nurse_verification_status === 'approved') {
      onboardingStatus = 'verified';
    }
  }

  await supabase.from('users').update({ onboarding_status: onboardingStatus }).eq('id', userId);
}

export async function saveProfileImages(userId: string, imageUrls: string[]) {
  const normalized = imageUrls.slice(0, 3).map((url, idx) => ({
    id: `${userId}-img-${idx + 1}`,
    userId,
    imageUrl: url,
    sortOrder: idx + 1,
    isMain: idx === 0,
    approvedStatus: 'pending' as const,
  }));

  if (USE_MOCK_DATA) {
    if (normalized.length === 0) return;
    replaceProfileImages(userId, normalized);
    updateUser(userId, { profileImageUrl: normalized[0].imageUrl });
    return;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase || normalized.length === 0) return;
  await supabase.from('profile_images').delete().eq('user_id', userId);
  await supabase.from('profile_images').insert(
    normalized.map((img) => ({
      user_id: img.userId,
      image_url: img.imageUrl,
      sort_order: img.sortOrder,
      is_main: img.isMain,
      approved_status: img.approvedStatus,
    })),
  );
  await supabase.from('users').update({ profile_image_url: normalized[0].imageUrl }).eq('id', userId);
}
