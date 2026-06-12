import { USE_MOCK_DATA } from '@/lib/config';
import { normalizeMaleJob } from '@/lib/male-job-options';
import {
  getFemaleProfile,
  getMaleProfile,
  listBlocksForUser,
  listCreditTransactions,
  listFavorites,
  listInterestSignalsForTarget,
  listMessages,
  listMatchesForUser,
  listProfileImages,
  listReports,
  listUsers,
} from '@/lib/mock-data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { AppUser } from '@/lib/types/domain';

type Scope = 'all' | 'female' | 'male';
type AdminTraceContext = {
  pathname?: string;
  role?: string;
};

type Distribution = {
  label: string;
  count: number;
};

type CounterSet = {
  pending: number;
  approved: number;
  rejected: number;
};

export type AdminMetrics = {
  userCounts: {
    total: number;
    female: number;
    male: number;
    provisional: number;
    verified: number;
    nurseApprovedFemale: number;
    maleReviewApproved: number;
    suspended: number;
  };
  matching: {
    totalMatches: number;
    todayMatches: number;
    sevenDayMatches: number;
    messageCount: number;
    relationshipMode: number;
    scheduledDelete: number;
  };
  attributes: {
    genderRatio: Distribution[];
    ageBands: Distribution[];
    locations: Distribution[];
    maleJobs: Distribution[];
    maleIncomeBands: Distribution[];
    maleMaritalStatus: Distribution[];
    femaleWorkplaceType: Distribution[];
    femaleNightShift: Distribution[];
  };
  reviews: {
    verification: CounterSet;
    nurse: CounterSet;
    maleReview: CounterSet;
    photo: CounterSet;
    riskCheck: Distribution[];
  };
  safety: {
    reportOpen: number;
    reportReviewing: number;
    reportResolved: number;
    blockCount: number;
    permanentBanCount: number;
  };
  economy: {
    interestSignals: number;
    favorites: number;
    paymentCount: number;
    creditConsumption: number;
  };
};

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sevenDaysAgo(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - 6);
  return d;
}

function toIncomeBand(income: string) {
  const numeric = Number((income || '').replace(/[^\d]/g, ''));
  if (!numeric || Number.isNaN(numeric)) return '未入力/不明';
  if (numeric < 400) return '400万円未満';
  if (numeric < 600) return '400-599万円';
  if (numeric < 800) return '600-799万円';
  if (numeric < 1000) return '800-999万円';
  return '1000万円以上';
}

function toAgeBand(age: number) {
  if (age < 25) return '18-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  if (age < 45) return '40-44';
  return '45+';
}

function countBy<T extends string>(items: T[]) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    map.set(item, (map.get(item) ?? 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function countSet(values: Array<'pending' | 'approved' | 'rejected'>): CounterSet {
  return {
    pending: values.filter((v) => v === 'pending').length,
    approved: values.filter((v) => v === 'approved').length,
    rejected: values.filter((v) => v === 'rejected').length,
  };
}

function filterScopeUsers(users: AppUser[], scope: Scope) {
  const endUsers = users.filter((u) => u.role === 'user');
  if (scope === 'female') return endUsers.filter((u) => u.gender === 'female');
  if (scope === 'male') return endUsers.filter((u) => u.gender === 'male');
  return endUsers;
}

export async function getAdminMetrics(scope: Scope, context?: AdminTraceContext): Promise<AdminMetrics> {
  if (USE_MOCK_DATA) {
    const users = filterScopeUsers(listUsers(), scope);
    const userIds = new Set(users.map((u) => u.id));
    const allUsers = filterScopeUsers(listUsers(), 'all');
    const allEndUserIds = new Set(allUsers.map((u) => u.id));

    const dedupMatches = allUsers
      .flatMap((u) => listMatchesForUser(u.id))
      .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
      .filter((m) => allEndUserIds.has(m.userAId) && allEndUserIds.has(m.userBId));
    const scopedMatches = dedupMatches.filter((m) => userIds.has(m.userAId) || userIds.has(m.userBId));
    const today = startOfDay();
    const seven = sevenDaysAgo();

    const reports = listReports().filter((r) => userIds.has(r.targetUserId));
    const blockCount = users.reduce((acc, user) => acc + listBlocksForUser(user.id).length, 0);

    const femaleProfiles = users
      .filter((u) => u.gender === 'female')
      .map((u) => getFemaleProfile(u.id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const maleProfiles = users
      .filter((u) => u.gender === 'male')
      .map((u) => getMaleProfile(u.id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const photoStates = users.flatMap((u) => listProfileImages(u.id).map((img) => img.approvedStatus));
    const riskCounts = countBy(users.map((u) => u.riskCheckStatus));

    return {
      userCounts: {
        total: users.length,
        female: users.filter((u) => u.gender === 'female').length,
        male: users.filter((u) => u.gender === 'male').length,
        provisional: users.filter((u) => u.onboardingStatus === 'provisional').length,
        verified: users.filter((u) => u.verificationStatus === 'approved').length,
        nurseApprovedFemale: femaleProfiles.filter((p) => p.nurseVerificationStatus === 'approved').length,
        maleReviewApproved: maleProfiles.filter((p) => p.maleReviewStatus === 'approved').length,
        suspended: users.filter((u) => u.isSuspended).length,
      },
      matching: {
        totalMatches: scopedMatches.length,
        todayMatches: scopedMatches.filter((m) => new Date(m.createdAt) >= today).length,
        sevenDayMatches: scopedMatches.filter((m) => new Date(m.createdAt) >= seven).length,
        messageCount: scopedMatches.reduce((acc, match) => acc + listMessages(match.id).length, 0),
        relationshipMode: scopedMatches.filter((m) => m.relationshipStatus === 'relationship_mode').length,
        scheduledDelete: scopedMatches.filter((m) => m.relationshipStatus === 'scheduled_delete').length,
      },
      attributes: {
        genderRatio: countBy(users.map((u) => (u.gender === 'female' ? '女性' : '男性'))),
        ageBands: countBy(users.map((u) => toAgeBand(u.age))),
        locations: countBy(users.map((u) => u.location || '未設定')),
        maleJobs: countBy(maleProfiles.map((p) => normalizeMaleJob(p.job) || '未設定')),
        maleIncomeBands: countBy(maleProfiles.map((p) => toIncomeBand(p.income))),
        maleMaritalStatus: countBy(maleProfiles.map((p) => p.maritalStatus)),
        femaleWorkplaceType: countBy(femaleProfiles.map((p) => p.workplaceType)),
        femaleNightShift: countBy(femaleProfiles.map((p) => (p.hasNightShift ? 'あり' : 'なし'))),
      },
      reviews: {
        verification: countSet(users.map((u) => u.verificationStatus)),
        nurse: countSet(femaleProfiles.map((p) => p.nurseVerificationStatus)),
        maleReview: countSet(maleProfiles.map((p) => p.maleReviewStatus)),
        photo: countSet(photoStates.length > 0 ? photoStates : ['pending']),
        riskCheck: riskCounts,
      },
      safety: {
        reportOpen: reports.filter((r) => r.status === 'open').length,
        reportReviewing: reports.filter((r) => r.status === 'reviewing').length,
        reportResolved: reports.filter((r) => r.status === 'resolved').length,
        blockCount,
        permanentBanCount: users.filter((u) => u.moderationAction === 'permanent_ban').length,
      },
      economy: {
        interestSignals: users.reduce((acc, u) => acc + listInterestSignalsForTarget(u.id).length, 0),
        favorites: users.reduce((acc, u) => acc + listFavorites(u.id).length, 0),
        paymentCount: listCreditTransactions().filter((tx) => tx.type === 'purchase').length,
        creditConsumption: Math.abs(
          listCreditTransactions()
            .filter((tx) => tx.type === 'consume')
            .reduce((sum, tx) => sum + tx.amount, 0),
        ),
      },
    };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return {
      userCounts: { total: 0, female: 0, male: 0, provisional: 0, verified: 0, nurseApprovedFemale: 0, maleReviewApproved: 0, suspended: 0 },
      matching: { totalMatches: 0, todayMatches: 0, sevenDayMatches: 0, messageCount: 0, relationshipMode: 0, scheduledDelete: 0 },
      attributes: {
        genderRatio: [],
        ageBands: [],
        locations: [],
        maleJobs: [],
        maleIncomeBands: [],
        maleMaritalStatus: [],
        femaleWorkplaceType: [],
        femaleNightShift: [],
      },
      reviews: {
        verification: { pending: 0, approved: 0, rejected: 0 },
        nurse: { pending: 0, approved: 0, rejected: 0 },
        maleReview: { pending: 0, approved: 0, rejected: 0 },
        photo: { pending: 0, approved: 0, rejected: 0 },
        riskCheck: [],
      },
      safety: { reportOpen: 0, reportReviewing: 0, reportResolved: 0, blockCount: 0, permanentBanCount: 0 },
      economy: { interestSignals: 0, favorites: 0, paymentCount: 0, creditConsumption: 0 },
    };
  }
  const tracePathname = context?.pathname ?? '/admin';
  const traceRole = context?.role ?? '(unknown)';
  const runMetricsQuery = async <T>(
    queryName: string,
    tableName: string,
    runner: () => Promise<{ data: T | null; error: { message: string } | null }>,
    fallback: T,
  ): Promise<T> => {
    try {
      const { data, error } = await runner();
      if (error) {
        console.error('ADMIN_METRICS_QUERY_ERROR', {
          pathname: tracePathname,
          role: traceRole,
          queryName,
          tableName,
          message: error.message,
        });
        return fallback;
      }
      return (data ?? fallback) as T;
    } catch (error) {
      console.error('ADMIN_METRICS_QUERY_EXCEPTION', {
        pathname: tracePathname,
        role: traceRole,
        queryName,
        tableName,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });
      return fallback;
    }
  };

  const usersRows = await runMetricsQuery(
    'metrics_users_list',
    'users',
    async () => await admin.from('users').select('id,role,gender,age,location,onboarding_status,verification_status,is_suspended,moderation_action,risk_check_status'),
    [],
  );
  const femaleRows = await runMetricsQuery(
    'metrics_female_profiles_list',
    'female_profiles',
    async () => await admin.from('female_profiles').select('user_id,nurse_verification_status,workplace_type,has_night_shift'),
    [],
  );
  const maleRows = await runMetricsQuery(
    'metrics_male_profiles_list',
    'male_profiles',
    async () => await admin.from('male_profiles').select('user_id,male_review_status,job,income,marital_status'),
    [],
  );
  const profileImages = await runMetricsQuery(
    'metrics_profile_images_list',
    'profile_images',
    async () => await admin.from('profile_images').select('user_id,approved_status'),
    [],
  );
  const reports = await runMetricsQuery(
    'metrics_reports_list',
    'reports',
    async () => await admin.from('reports').select('target_user_id,status'),
    [],
  );
  const blocks = await runMetricsQuery(
    'metrics_blocks_list',
    'blocks',
    async () => await admin.from('blocks').select('id,blocker_user_id,blocked_user_id'),
    [],
  );
  const swipes = await runMetricsQuery(
    'metrics_swipes_list',
    'swipes',
    async () => await admin.from('swipes').select('id,from_user_id,to_user_id,action,created_at'),
    [],
  );
  const matches = await runMetricsQuery(
    'metrics_matches_list',
    'matches',
    async () => await admin.from('matches').select('id,user_a_id,user_b_id,relationship_status,created_at'),
    [],
  );
  const messages = await runMetricsQuery(
    'metrics_messages_list',
    'messages',
    async () => await admin.from('messages').select('id,match_id,created_at'),
    [],
  );
  const interestSignals = await runMetricsQuery(
    'metrics_interest_signals_list',
    'interest_signals',
    async () => await admin.from('interest_signals').select('user_id,target_user_id'),
    [],
  );
  const favorites = await runMetricsQuery(
    'metrics_favorites_list',
    'favorites',
    async () => await admin.from('favorites').select('user_id,target_user_id'),
    [],
  );
  const creditTransactions = await runMetricsQuery(
    'metrics_credit_transactions_list',
    'credit_transactions',
    async () => await admin.from('credit_transactions').select('user_id,type,amount'),
    [],
  );
  console.log('ADMIN_METRICS_DATASET_COUNTS', {
    pathname: tracePathname,
    role: traceRole,
    users: usersRows.length,
    female_profiles: femaleRows.length,
    male_profiles: maleRows.length,
    reports: reports.length,
    swipes: swipes.length,
    matches: matches.length,
    messages: messages.length,
  });

  const users = filterScopeUsers(
    (usersRows ?? []).map((u) => ({
      id: u.id,
      role: u.role,
      gender: u.gender,
      age: u.age,
      location: u.location,
      onboardingStatus: u.onboarding_status,
      verificationStatus: u.verification_status,
      isSuspended: u.is_suspended,
      moderationAction: u.moderation_action,
      riskCheckStatus: u.risk_check_status,
    })) as AppUser[],
    scope,
  );
  const userIds = new Set(users.map((u) => u.id));
  const allEndUserIds = new Set(
    (usersRows ?? [])
      .filter((u) => u.role === 'user')
      .map((u) => u.id),
  );

  const scopedFemale = (femaleRows ?? []).filter((f) => userIds.has(f.user_id));
  const scopedMale = (maleRows ?? []).filter((m) => userIds.has(m.user_id));
  const scopedImages = (profileImages ?? []).filter((img) => userIds.has(img.user_id));
  const scopedReports = (reports ?? []).filter((r) => userIds.has(r.target_user_id));
  const scopedBlocks = (blocks ?? []).filter((b) => userIds.has(b.blocker_user_id) || userIds.has(b.blocked_user_id));
  const scopedMatches = (matches ?? []).filter(
    (m) =>
      allEndUserIds.has(m.user_a_id) &&
      allEndUserIds.has(m.user_b_id) &&
      (userIds.has(m.user_a_id) || userIds.has(m.user_b_id)),
  );
  const scopedMatchIds = new Set(scopedMatches.map((m) => m.id));
  const scopedMessages = (messages ?? []).filter((msg) => scopedMatchIds.has(msg.match_id));
  const scopedInterestSignals = (interestSignals ?? []).filter((row) => userIds.has(row.user_id) || userIds.has(row.target_user_id));
  const scopedFavorites = (favorites ?? []).filter((row) => userIds.has(row.user_id) || userIds.has(row.target_user_id));
  const scopedCreditTx = (creditTransactions ?? []).filter((row) => userIds.has(row.user_id));

  const today = startOfDay();
  const seven = sevenDaysAgo();

  return {
    userCounts: {
      total: users.length,
      female: users.filter((u) => u.gender === 'female').length,
      male: users.filter((u) => u.gender === 'male').length,
      provisional: users.filter((u) => u.onboardingStatus === 'provisional').length,
      verified: users.filter((u) => u.verificationStatus === 'approved').length,
      nurseApprovedFemale: scopedFemale.filter((f) => f.nurse_verification_status === 'approved').length,
      maleReviewApproved: scopedMale.filter((m) => m.male_review_status === 'approved').length,
      suspended: users.filter((u) => u.isSuspended).length,
    },
    matching: {
      totalMatches: scopedMatches.length,
      todayMatches: scopedMatches.filter((m) => new Date(m.created_at) >= today).length,
      sevenDayMatches: scopedMatches.filter((m) => new Date(m.created_at) >= seven).length,
      messageCount: scopedMessages.length,
      relationshipMode: scopedMatches.filter((m) => m.relationship_status === 'relationship_mode').length,
      scheduledDelete: scopedMatches.filter((m) => m.relationship_status === 'scheduled_delete').length,
    },
    attributes: {
      genderRatio: countBy(users.map((u) => (u.gender === 'female' ? '女性' : '男性'))),
      ageBands: countBy(users.map((u) => toAgeBand(u.age))),
      locations: countBy(users.map((u) => u.location || '未設定')),
      maleJobs: countBy(scopedMale.map((m) => normalizeMaleJob(m.job) || '未設定')),
      maleIncomeBands: countBy(scopedMale.map((m) => toIncomeBand(m.income))),
      maleMaritalStatus: countBy(scopedMale.map((m) => m.marital_status)),
      femaleWorkplaceType: countBy(scopedFemale.map((f) => f.workplace_type)),
      femaleNightShift: countBy(scopedFemale.map((f) => (f.has_night_shift ? 'あり' : 'なし'))),
    },
    reviews: {
      verification: countSet(users.map((u) => u.verificationStatus)),
      nurse: countSet(scopedFemale.map((f) => f.nurse_verification_status)),
      maleReview: countSet(scopedMale.map((m) => m.male_review_status)),
      photo: countSet(scopedImages.map((img) => img.approved_status)),
      riskCheck: countBy(users.map((u) => u.riskCheckStatus)),
    },
    safety: {
      reportOpen: scopedReports.filter((r) => r.status === 'open').length,
      reportReviewing: scopedReports.filter((r) => r.status === 'reviewing').length,
      reportResolved: scopedReports.filter((r) => r.status === 'resolved').length,
      blockCount: scopedBlocks.length,
      permanentBanCount: users.filter((u) => u.moderationAction === 'permanent_ban').length,
    },
    economy: {
      interestSignals: scopedInterestSignals.length,
      favorites: scopedFavorites.length,
      paymentCount: scopedCreditTx.filter((tx) => tx.type === 'purchase').length,
      creditConsumption: Math.abs(scopedCreditTx.filter((tx) => tx.type === 'consume').reduce((sum, tx) => sum + tx.amount, 0)),
    },
  };
}
