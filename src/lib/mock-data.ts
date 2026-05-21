import type {
  AdminActionLog,
  AdminActionType,
  AppUser,
  BlockRecord,
  CreditRecord,
  CreditTransactionRecord,
  CreditTransactionType,
  DailyRecommendationRecord,
  FavoriteRecord,
  FemaleProfile,
  InterestSignalRecord,
  InterestSignalType,
  LikeRecord,
  MaleProfile,
  MatchRecord,
  MessageRecord,
  ModerationAction,
  ProfileImageRecord,
  ReportReasonType,
  ReportRecord,
  ReportStatus,
  RiskCheckRecord,
  VerificationStatus,
} from '@/lib/types/domain';

const now = new Date().toISOString();

const users: AppUser[] = [
  {
    id: 'u_f_1',
    email: 'hana@nursematch.app',
    phone: '09011112221',
    role: 'user',
    gender: 'female',
    nickname: 'はな',
    birthdate: '1996-03-10',
    age: 30,
    location: '東京都',
    bio: '都内で働く看護師です。休日はカフェ巡り。',
    profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    desiredGender: 'both',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/u_f_1-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'u_f_2',
    email: 'yui@nursematch.app',
    phone: '09011112222',
    role: 'user',
    gender: 'female',
    nickname: 'ゆい',
    birthdate: '1998-05-23',
    age: 27,
    location: '神奈川県',
    bio: '夜勤あり。映画好きです。',
    profileImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
    desiredGender: 'female',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/u_f_2-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'u_m_1',
    email: 'taro@nursematch.app',
    phone: '09011112223',
    role: 'user',
    gender: 'male',
    nickname: 'タロウ',
    birthdate: '1992-11-05',
    age: 33,
    location: '東京都',
    bio: 'IT企業勤務。穏やかな性格です。',
    profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    desiredGender: 'female',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/u_m_1-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'u_m_2',
    email: 'ken@nursematch.app',
    phone: '09011112224',
    role: 'user',
    gender: 'male',
    nickname: 'けん',
    birthdate: '1994-07-18',
    age: 31,
    location: '埼玉県',
    bio: '休日はランニングしています。',
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    desiredGender: 'female',
    onboardingStatus: 'provisional',
    riskCheckStatus: 'not_checked',
    verificationStatus: 'pending',
    identityDocumentUrl: 'mock://identity/u_m_2-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'u_f_test',
    email: 'test-female@nursematch.app',
    phone: '09011112225',
    role: 'user',
    gender: 'female',
    nickname: 'さくら',
    birthdate: '1997-05-20',
    age: 29,
    location: '東京都',
    bio: 'テスト用女性アカウントです。',
    profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    desiredGender: 'male',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: null,
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: true,
  },
  {
    id: 'u_m_test',
    email: 'test-male@nursematch.app',
    phone: '09011112226',
    role: 'user',
    gender: 'male',
    nickname: '蓮',
    birthdate: '1992-04-03',
    age: 34,
    location: '東京都',
    bio: 'テスト用男性アカウントです。',
    profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    desiredGender: 'female',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: null,
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: true,
  },
  {
    id: 'admin_1',
    email: 'admin@nursematch.app',
    phone: '09011112227',
    role: 'super_admin',
    gender: 'female',
    nickname: '運営',
    birthdate: '1990-01-01',
    age: 36,
    location: '東京都',
    bio: '運営アカウント',
    profileImageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
    desiredGender: 'both',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/admin-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'admin_f_1',
    email: 'female-admin@nursematch.app',
    phone: '09011112228',
    role: 'female_admin',
    gender: 'female',
    nickname: '女性管理',
    birthdate: '1991-01-01',
    age: 35,
    location: '東京都',
    bio: '女性管理アカウント',
    profileImageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
    desiredGender: 'both',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/admin-f-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
  {
    id: 'admin_m_1',
    email: 'male-admin@nursematch.app',
    phone: '09011112229',
    role: 'male_admin',
    gender: 'male',
    nickname: '男性管理',
    birthdate: '1991-01-01',
    age: 35,
    location: '東京都',
    bio: '男性管理アカウント',
    profileImageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800',
    desiredGender: 'both',
    onboardingStatus: 'verified',
    riskCheckStatus: 'clear',
    verificationStatus: 'approved',
    identityDocumentUrl: 'mock://identity/admin-m-id.pdf',
    rejectedReason: null,
    moderationAction: 'none',
    isSuspended: false,
    isTestUser: false,
  },
];

const femaleProfiles: FemaleProfile[] = [
  {
    userId: 'u_f_1',
    nurseDocumentUrl: 'mock://nurse/u_f_1-license.pdf',
    nurseVerificationStatus: 'approved',
    workplaceType: 'hospital',
    hasNightShift: true,
  },
  {
    userId: 'u_f_2',
    nurseDocumentUrl: 'mock://nurse/u_f_2-license.pdf',
    nurseVerificationStatus: 'approved',
    workplaceType: 'clinic',
    hasNightShift: false,
  },
  {
    userId: 'u_f_test',
    nurseDocumentUrl: '',
    nurseVerificationStatus: 'approved',
    workplaceType: 'hospital',
    hasNightShift: true,
  },
];

const maleProfiles: MaleProfile[] = [
  {
    userId: 'u_m_1',
    job: 'IT',
    income: '700万円',
    maritalStatus: 'single',
    hasChildren: false,
    maleReviewStatus: 'approved',
    incomeVerified: true,
    facePhotoVerified: true,
    internalMemo: null,
    height: 178,
    bodyType: '普通',
    holiday: '土日',
    smoking: 'しない',
    drinking: 'ときどき',
    nightShiftUnderstanding: true,
    shiftWorkUnderstanding: true,
    lateNightContactOk: false,
    firstDateCost: '男性が多めに負担',
    personalityTags: ['誠実', '聞き上手', '清潔感重視'],
  },
  {
    userId: 'u_m_2',
    job: '看護師',
    income: '500万円',
    maritalStatus: 'partner',
    hasChildren: false,
    maleReviewStatus: 'pending',
    incomeVerified: false,
    facePhotoVerified: true,
    internalMemo: '婚姻状態の補足提出待ち',
    height: 172,
    bodyType: '細身',
    holiday: 'シフト',
    smoking: 'しない',
    drinking: 'しない',
    nightShiftUnderstanding: true,
    shiftWorkUnderstanding: true,
    lateNightContactOk: true,
    firstDateCost: '相談して決めたい',
    personalityTags: ['落ち着いている', '優しい'],
  },
  {
    userId: 'u_m_test',
    job: '経営者',
    income: '1000万円〜1500万円',
    maritalStatus: 'single',
    hasChildren: false,
    maleReviewStatus: 'approved',
    incomeVerified: true,
    facePhotoVerified: true,
    internalMemo: null,
    height: 178,
    bodyType: '普通',
    holiday: '土日',
    smoking: 'なし',
    drinking: 'たまに',
    nightShiftUnderstanding: true,
    shiftWorkUnderstanding: true,
    lateNightContactOk: true,
    firstDateCost: '男性が負担',
    personalityTags: ['誠実', '落ち着き'],
  },
];

const likes: LikeRecord[] = [
  {
    id: 'like_1',
    fromUserId: 'u_f_2',
    toUserId: 'u_f_1',
    status: 'like',
    createdAt: now,
  },
];

const favorites: FavoriteRecord[] = [
  {
    id: 'favorite_1',
    userId: 'u_m_2',
    targetUserId: 'u_f_1',
    createdAt: now,
  },
];

const matches: MatchRecord[] = [
  {
    id: 'match_1',
    userAId: 'u_f_2',
    userBId: 'u_f_1',
    relationshipStatus: 'active',
    relationshipStartedAt: null,
    scheduledDeleteAt: null,
    holdDeletion: false,
    createdAt: now,
  },
];

const messages: MessageRecord[] = [
  {
    id: 'msg_1',
    matchId: 'match_1',
    senderId: 'u_f_2',
    body: 'はじめまして！よろしくお願いします。',
    createdAt: now,
  },
];

const reports: ReportRecord[] = [
  {
    id: 'report_1',
    reporterId: 'u_f_1',
    targetUserId: 'u_m_1',
    reason: '婚姻状態が事実と異なる可能性',
    reasonType: 'fake_marital_status',
    detail: 'プロフィール記載と会話内容が矛盾していました。',
    status: 'open',
    createdAt: now,
  },
];

const blocks: BlockRecord[] = [];

const adminActions: AdminActionLog[] = [];
const riskChecks: RiskCheckRecord[] = [
  {
    id: 'risk_1',
    userId: 'u_f_1',
    status: 'clear',
    searchedAt: now,
    searchKeywords: ['はな 1996-03-10', 'はな 看護師'],
    hitCount: 0,
    sourceUrls: [],
    adminMemo: '重大な一致なし',
    finalDeciderId: 'admin_1',
    decidedAt: now,
  },
];

const profileImages: ProfileImageRecord[] = [
  {
    id: 'pi_f1_1',
    userId: 'u_f_1',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    sortOrder: 1,
    isMain: true,
    approvedStatus: 'approved',
  },
  {
    id: 'pi_f1_2',
    userId: 'u_f_1',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    sortOrder: 2,
    isMain: false,
    approvedStatus: 'approved',
  },
  {
    id: 'pi_m1_1',
    userId: 'u_m_1',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    sortOrder: 1,
    isMain: true,
    approvedStatus: 'approved',
  },
  {
    id: 'pi_f_test_1',
    userId: 'u_f_test',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    sortOrder: 1,
    isMain: true,
    approvedStatus: 'approved',
  },
  {
    id: 'pi_m_test_1',
    userId: 'u_m_test',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    sortOrder: 1,
    isMain: true,
    approvedStatus: 'approved',
  },
];

const dailyRecommendations: DailyRecommendationRecord[] = [
  {
    id: 'daily_1',
    userId: 'u_f_1',
    targetUserId: 'u_m_1',
    recommendationDate: new Date().toISOString().slice(0, 10),
    rank: 1,
    reason: '希望条件との一致度が高い候補です',
    createdAt: now,
  },
];

const interestSignals: InterestSignalRecord[] = [];
const credits: CreditRecord[] = [
  {
    id: 'credit_u_m_1',
    userId: 'u_m_1',
    balance: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'credit_u_m_test',
    userId: 'u_m_test',
    balance: 10,
    createdAt: now,
    updatedAt: now,
  },
];
const creditTransactions: CreditTransactionRecord[] = [];

function uuid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function listUsers() {
  return users;
}

export function getUserById(userId: string) {
  return users.find((user) => user.id === userId) ?? null;
}

export function getUserByEmail(email: string) {
  return users.find((user) => user.email === email) ?? null;
}

export function getUserByPhone(phone: string) {
  return users.find((user) => user.phone === phone) ?? null;
}

export function updateUser(userId: string, patch: Partial<AppUser>) {
  const target = users.find((user) => user.id === userId);
  if (!target) return null;
  Object.assign(target, patch);
  return target;
}

export function listProfileImages(userId: string) {
  return profileImages.filter((item) => item.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function upsertProfileImage(image: ProfileImageRecord) {
  const idx = profileImages.findIndex((item) => item.id === image.id || (item.userId === image.userId && item.sortOrder === image.sortOrder));
  if (idx >= 0) {
    profileImages[idx] = image;
  } else {
    profileImages.push(image);
  }
}

export function replaceProfileImages(userId: string, images: ProfileImageRecord[]) {
  for (let i = profileImages.length - 1; i >= 0; i -= 1) {
    if (profileImages[i].userId === userId) profileImages.splice(i, 1);
  }
  profileImages.push(...images);
}

export function updateUserModeration(userId: string, moderationAction: ModerationAction, rejectedReason: string | null) {
  return updateUser(userId, { moderationAction, rejectedReason });
}

export function getFemaleProfile(userId: string) {
  return femaleProfiles.find((profile) => profile.userId === userId) ?? null;
}

export function getMaleProfile(userId: string) {
  return maleProfiles.find((profile) => profile.userId === userId) ?? null;
}

export function upsertFemaleProfile(profile: FemaleProfile) {
  const idx = femaleProfiles.findIndex((item) => item.userId === profile.userId);
  if (idx >= 0) {
    femaleProfiles[idx] = profile;
  } else {
    femaleProfiles.push(profile);
  }
}

export function upsertMaleProfile(profile: MaleProfile) {
  const idx = maleProfiles.findIndex((item) => item.userId === profile.userId);
  if (idx >= 0) {
    maleProfiles[idx] = profile;
  } else {
    maleProfiles.push(profile);
  }
}

export function setNurseVerificationStatus(userId: string, status: VerificationStatus) {
  const profile = femaleProfiles.find((item) => item.userId === userId);
  if (!profile) return null;
  profile.nurseVerificationStatus = status;
  return profile;
}

export function setMaleReviewStatus(userId: string, status: MaleProfile['maleReviewStatus'], internalMemo?: string) {
  const profile = maleProfiles.find((item) => item.userId === userId);
  if (!profile) return null;
  profile.maleReviewStatus = status;
  if (typeof internalMemo === 'string') {
    profile.internalMemo = internalMemo || null;
  }
  return profile;
}

export function listLikes() {
  return likes;
}

export function addLike(fromUserId: string, toUserId: string, status: 'like' | 'skip') {
  const existing = likes.find((item) => item.fromUserId === fromUserId && item.toUserId === toUserId);
  if (existing) {
    existing.status = status;
    return existing;
  }

  const record: LikeRecord = {
    id: uuid('like'),
    fromUserId,
    toUserId,
    status,
    createdAt: new Date().toISOString(),
  };
  likes.push(record);
  return record;
}

export function listFavorites(userId: string) {
  return favorites.filter((item) => item.userId === userId);
}

export function listDailyRecommendations(userId: string, recommendationDate: string) {
  return dailyRecommendations
    .filter((item) => item.userId === userId && item.recommendationDate === recommendationDate)
    .sort((a, b) => a.rank - b.rank);
}

export function replaceDailyRecommendations(userId: string, recommendationDate: string, rows: DailyRecommendationRecord[]) {
  for (let i = dailyRecommendations.length - 1; i >= 0; i -= 1) {
    if (dailyRecommendations[i].userId === userId && dailyRecommendations[i].recommendationDate === recommendationDate) {
      dailyRecommendations.splice(i, 1);
    }
  }
  dailyRecommendations.push(...rows);
}

export function listInterestSignalsForTarget(targetUserId: string) {
  return interestSignals.filter((item) => item.targetUserId === targetUserId);
}

export function listInterestSignalsByUser(userId: string) {
  return interestSignals.filter((item) => item.userId === userId);
}

export function upsertInterestSignal(input: {
  userId: string;
  targetUserId: string;
  signalType: InterestSignalType;
  matchedPreference: boolean;
  reason: string | null;
  expiresAt: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const existingIdx = interestSignals.findIndex(
    (item) =>
      item.userId === input.userId &&
      item.targetUserId === input.targetUserId &&
      item.signalType === input.signalType &&
      item.createdAt.slice(0, 10) === today,
  );
  const next: InterestSignalRecord = {
    id: existingIdx >= 0 ? interestSignals[existingIdx].id : uuid('interest'),
    userId: input.userId,
    targetUserId: input.targetUserId,
    signalType: input.signalType,
    matchedPreference: input.matchedPreference,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };
  if (existingIdx >= 0) {
    interestSignals[existingIdx] = next;
  } else {
    interestSignals.push(next);
  }
  return next;
}

export function getCreditByUser(userId: string) {
  return credits.find((item) => item.userId === userId) ?? null;
}

export function upsertCredit(userId: string, balance: number) {
  const existing = credits.find((item) => item.userId === userId);
  if (existing) {
    existing.balance = balance;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const row: CreditRecord = {
    id: uuid('credit'),
    userId,
    balance,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  credits.push(row);
  return row;
}

export function addCreditTransaction(input: {
  userId: string;
  type: CreditTransactionType;
  amount: number;
  reason: string;
  relatedMatchId?: string | null;
}) {
  const row: CreditTransactionRecord = {
    id: uuid('credit_tx'),
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    reason: input.reason,
    relatedMatchId: input.relatedMatchId ?? null,
    createdAt: new Date().toISOString(),
  };
  creditTransactions.unshift(row);
  return row;
}

export function listCreditTransactionsByUser(userId: string) {
  return creditTransactions.filter((item) => item.userId === userId);
}

export function listCreditTransactions() {
  return creditTransactions;
}

export function toggleFavorite(userId: string, targetUserId: string) {
  const idx = favorites.findIndex((item) => item.userId === userId && item.targetUserId === targetUserId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    return false;
  }
  favorites.push({
    id: uuid('favorite'),
    userId,
    targetUserId,
    createdAt: new Date().toISOString(),
  });
  return true;
}

export function listMatchesForUser(userId: string) {
  return matches.filter((match) => match.userAId === userId || match.userBId === userId);
}

export function ensureMatch(userAId: string, userBId: string) {
  const existing = matches.find(
    (match) =>
      (match.userAId === userAId && match.userBId === userBId) ||
      (match.userAId === userBId && match.userBId === userAId),
  );
  if (existing) return existing;

  const match: MatchRecord = {
    id: uuid('match'),
    userAId,
    userBId,
    relationshipStatus: 'active',
    relationshipStartedAt: null,
    scheduledDeleteAt: null,
    holdDeletion: false,
    createdAt: new Date().toISOString(),
  };
  matches.push(match);
  return match;
}

export function updateMatch(matchId: string, patch: Partial<MatchRecord>) {
  const match = matches.find((item) => item.id === matchId);
  if (!match) return null;
  Object.assign(match, patch);
  return match;
}

export function getMatchById(matchId: string) {
  return matches.find((match) => match.id === matchId) ?? null;
}

export function listMessages(matchId: string) {
  return messages.filter((message) => message.matchId === matchId);
}

export function addMessage(matchId: string, senderId: string, body: string) {
  const message: MessageRecord = {
    id: uuid('msg'),
    matchId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}

export function listReports() {
  return reports;
}

export function setReportStatus(reportId: string, status: ReportStatus) {
  const report = reports.find((item) => item.id === reportId);
  if (!report) return null;
  report.status = status;
  return report;
}

export function addReport(input: {
  reporterId: string;
  targetUserId: string;
  reason: string;
  reasonType: ReportReasonType;
  detail: string;
}) {
  const row: ReportRecord = {
    id: uuid('report'),
    reporterId: input.reporterId,
    targetUserId: input.targetUserId,
    reason: input.reason,
    reasonType: input.reasonType,
    detail: input.detail,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  reports.push(row);
  return row;
}

export function listBlocksForUser(userId: string) {
  return blocks.filter((b) => b.blockerUserId === userId);
}

export function isBlockedBetween(userAId: string, userBId: string) {
  return blocks.some(
    (b) =>
      (b.blockerUserId === userAId && b.blockedUserId === userBId) ||
      (b.blockerUserId === userBId && b.blockedUserId === userAId),
  );
}

export function addBlock(blockerUserId: string, blockedUserId: string) {
  const exists = blocks.find((b) => b.blockerUserId === blockerUserId && b.blockedUserId === blockedUserId);
  if (exists) return exists;

  const row: BlockRecord = {
    id: uuid('block'),
    blockerUserId,
    blockedUserId,
    createdAt: new Date().toISOString(),
  };
  blocks.push(row);
  return row;
}

export function listAdminActions() {
  return adminActions;
}

export function getRiskCheck(userId: string) {
  return riskChecks.find((item) => item.userId === userId) ?? null;
}

export function upsertRiskCheck(record: RiskCheckRecord) {
  const idx = riskChecks.findIndex((item) => item.userId === record.userId);
  if (idx >= 0) {
    riskChecks[idx] = record;
  } else {
    riskChecks.push(record);
  }
}

export function addAdminAction(input: {
  adminUserId: string;
  targetUserId: string;
  actionType: AdminActionType;
  beforeValue?: string | null;
  afterValue?: string | null;
  note?: string | null;
}) {
  const row: AdminActionLog = {
    id: uuid('admin_action'),
    adminUserId: input.adminUserId,
    targetUserId: input.targetUserId,
    actionType: input.actionType,
    beforeValue: input.beforeValue ?? null,
    afterValue: input.afterValue ?? null,
    note: input.note ?? null,
    createdAt: new Date().toISOString(),
  };
  adminActions.unshift(row);
  return row;
}
