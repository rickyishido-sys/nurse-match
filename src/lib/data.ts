import { cookies } from 'next/headers';
import { USE_MOCK_DATA } from '@/lib/config';
import {
  addAdminAction,
  addBlock,
  addLike,
  addMessage,
  addReport,
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
  listReports,
  listUsers,
  setMaleReviewStatus,
  setNurseVerificationStatus,
  setReportStatus,
  updateMatch,
  updateUser,
  updateUserModeration,
  upsertFemaleProfile,
  upsertMaleProfile,
} from '@/lib/mock-data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAdminSignedDocumentUrl, getSignedProfileImageUrl } from '@/lib/storage';
import type {
  AdminActionType,
  AppUser,
  FemaleProfile,
  MaleProfile,
  MaritalStatus,
  ModerationAction,
  ReportReasonType,
  ReportStatus,
} from '@/lib/types/domain';
import type { Database } from '@/lib/types/database';

function mapUser(row: Database['public']['Tables']['users']['Row']): AppUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    gender: row.gender,
    nickname: row.nickname,
    birthdate: row.birthdate,
    age: row.age,
    location: row.location,
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    desiredGender: row.desired_gender,
    verificationStatus: row.verification_status,
    identityDocumentUrl: row.identity_document_url,
    rejectedReason: row.rejected_reason,
    moderationAction: row.moderation_action,
    isSuspended: row.is_suspended,
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
  return {
    id: row.id,
    email: '',
    role: 'user',
    gender: row.gender,
    nickname: row.nickname,
    birthdate: '',
    age: row.age,
    location: row.location,
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    desiredGender: row.desired_gender,
    verificationStatus: row.verification_status,
    identityDocumentUrl: null,
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: row.is_suspended,
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
      .map((candidate) => ({
        user: candidate,
        maleProfile: getMaleProfile(candidate.id),
        femaleProfile: getFemaleProfile(candidate.id),
      }));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const blockedSet = await getBlockedRelationSetForUser(user.id);

  const { data: usersData } = await supabase
    .from('public_user_cards')
    .select('*')
    .eq('verification_status', 'approved')
    .eq('is_suspended', false)
    .neq('id', user.id);

  const { data: likesData } = await supabase.from('likes').select('to_user_id').eq('from_user_id', user.id);
  const swipedIds = new Set((likesData ?? []).map((row) => row.to_user_id));

  const { data: females } = await supabase.from('female_profile_public').select('*');
  const { data: males } = await supabase.from('male_profile_public').select('*');

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
    });

  const relationshipFiltered: AppUser[] = [];
  for (const candidate of filtered) {
    if (!(await hasAnyRelationshipMode(candidate.id))) {
      relationshipFiltered.push(candidate);
    }
  }

  return Promise.all(
    relationshipFiltered.map(async (candidate) => ({
      user: await resolveProfileImage(candidate),
      maleProfile: maleMap.get(candidate.id) ?? null,
      femaleProfile: femaleMap.get(candidate.id) ?? null,
    })),
  );
}

export async function swipe(fromUserId: string, toUserId: string, action: 'like' | 'skip') {
  if (USE_MOCK_DATA) {
    const from = getUserById(fromUserId);
    const to = getUserById(toUserId);
    if (!from || !to || from.gender === 'male' || isBlockedBetween(fromUserId, toUserId)) return;
    if (hasAnyRelationshipModeInMock(fromUserId) || hasAnyRelationshipModeInMock(toUserId)) return;

    addLike(fromUserId, toUserId, action);

    if (action !== 'like') return;
    if (to.gender === 'male') {
      ensureMatch(fromUserId, toUserId);
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

  const { data: fromUserRow } = await supabase.from('users').select('gender').eq('id', fromUserId).single();
  if (!fromUserRow || fromUserRow.gender !== 'female') {
    throw new Error('男性ユーザーはスワイプできません');
  }

  await supabase.from('likes').upsert({ from_user_id: fromUserId, to_user_id: toUserId, status: action });
  if (action !== 'like') return;

  const { data: toUserRow } = await supabase.from('users').select('gender').eq('id', toUserId).single();
  if (!toUserRow) return;

  if (toUserRow.gender === 'male') {
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
    if (match?.relationshipStatus === 'deleted') {
      return { match: null, messages: [] };
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
  if (!isMatchActive(match)) {
    throw new Error('成立済みマッチはチャット送信できません');
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
      relationshipMatches,
    };
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');

  const [{ data: usersRows }, { data: reportRows }, { data: femaleRows }, { data: maleRows }, { data: actionRows }, { data: matchRows }] =
    await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('female_profiles').select('*'),
      supabase.from('male_profiles').select('*'),
      supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('matches').select('*').in('relationship_status', ['relationship_mode', 'scheduled_delete']),
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

export async function updateMatchHoldDeletion(matchId: string, holdDeletion: boolean) {
  if (USE_MOCK_DATA) {
    updateMatch(matchId, { holdDeletion });
    return;
  }
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;
  await supabase.from('matches').update({ hold_deletion: holdDeletion }).eq('id', matchId);
}

export async function saveProfile(userId: string, form: Record<string, string>) {
  if (USE_MOCK_DATA) {
    const user = getUserById(userId);
    if (!user) return;

    updateUser(userId, {
      nickname: form.nickname,
      location: form.location,
      bio: form.bio,
      desiredGender: (form.desiredGender as AppUser['desiredGender']) ?? user.desiredGender,
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
    } else {
      const current = getFemaleProfile(userId);
      upsertFemaleProfile({
        userId,
        nurseDocumentUrl: form.nurseDocumentUrl || current?.nurseDocumentUrl || 'mock://nurse/new.pdf',
        nurseVerificationStatus: form.nurseDocumentUrl ? 'pending' : current?.nurseVerificationStatus ?? 'pending',
        workplaceType: (form.workplaceType as FemaleProfile['workplaceType']) ?? 'other',
        hasNightShift: form.hasNightShift === 'on',
      });
    }
    return;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: userRow } = await supabase.from('users').select('gender, desired_gender').eq('id', userId).single();
  if (!userRow) return;

  await supabase
    .from('users')
    .update({
      nickname: form.nickname,
      location: form.location,
      bio: form.bio,
      desired_gender: (form.desiredGender as AppUser['desiredGender']) ?? userRow.desired_gender,
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
  } else {
    const { data: current } = await supabase.from('female_profiles').select('*').eq('user_id', userId).maybeSingle();
    await supabase.from('female_profiles').upsert({
      user_id: userId,
      nurse_document_url: form.nurseDocumentUrl || current?.nurse_document_url || '',
      nurse_verification_status: form.nurseDocumentUrl ? 'pending' : current?.nurse_verification_status ?? 'pending',
      workplace_type: (form.workplaceType as FemaleProfile['workplaceType']) ?? 'other',
      has_night_shift: form.hasNightShift === 'on',
    });
  }
}
