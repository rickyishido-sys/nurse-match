export type UserRole = 'user' | 'female_admin' | 'male_admin' | 'super_admin';
export type Gender = 'female' | 'male';
export type DesiredGender = 'male' | 'female' | 'both';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type MaleReviewStatus = 'pending' | 'approved' | 'rejected';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'partner';
export type OnboardingStatus = 'provisional' | 'profile_completed' | 'verified';
export type RiskCheckStatus = 'not_checked' | 'checking' | 'clear' | 'review_required' | 'rejected';

export type ModerationAction = 'none' | 'warning' | 'suspend' | 'permanent_ban';
export type ReportReasonType =
  | 'fake_marital_status'
  | 'harassment'
  | 'dangerous'
  | 'fake_profile'
  | 'spam'
  | 'other';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type AdminActionType =
  | 'verification_status_changed'
  | 'nurse_verification_status_changed'
  | 'male_review_status_changed'
  | 'user_suspended'
  | 'user_permanent_banned'
  | 'rejected_reason_updated'
  | 'internal_memo_updated';

export type AppUser = {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  gender: Gender;
  nickname: string;
  birthdate: string;
  age: number;
  location: string;
  bio: string;
  profileImageUrl: string;
  desiredGender: DesiredGender;
  onboardingStatus: OnboardingStatus;
  riskCheckStatus: RiskCheckStatus;
  verificationStatus: VerificationStatus;
  identityDocumentUrl: string | null;
  rejectedReason: string | null;
  moderationAction: ModerationAction;
  isSuspended: boolean;
  isTestUser?: boolean;
  deletedAt?: string | null;
};

export type ProfileImageRecord = {
  id: string;
  userId: string;
  imageUrl: string;
  sortOrder: number;
  isMain: boolean;
  approvedStatus: VerificationStatus;
};

export type FemaleProfile = {
  userId: string;
  nurseDocumentUrl: string;
  nurseVerificationStatus: VerificationStatus;
  workplaceType: 'hospital' | 'clinic' | 'beauty' | 'nightshift' | 'care_facility' | 'home_visit' | 'other';
  hasNightShift: boolean;
};

export type MaleProfile = {
  userId: string;
  job: string;
  income: string;
  maritalStatus: MaritalStatus;
  hasChildren: boolean;
  maleReviewStatus: MaleReviewStatus;
  incomeVerified: boolean;
  facePhotoVerified: boolean;
  internalMemo: string | null;
  height: number;
  bodyType: string;
  holiday: string;
  smoking: string;
  drinking: string;
  nightShiftUnderstanding: boolean;
  shiftWorkUnderstanding: boolean;
  lateNightContactOk: boolean;
  firstDateCost: string;
  personalityTags: string[];
};

export type LikeRecord = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'like' | 'skip';
  createdAt: string;
};

export type FavoriteRecord = {
  id: string;
  userId: string;
  targetUserId: string;
  createdAt: string;
};

export type DailyRecommendationRecord = {
  id: string;
  userId: string;
  targetUserId: string;
  recommendationDate: string;
  rank: number;
  reason: string;
  createdAt: string;
};

export type InterestSignalType = 'interested' | 'skipped';

export type InterestSignalRecord = {
  id: string;
  userId: string;
  targetUserId: string;
  signalType: InterestSignalType;
  matchedPreference: boolean;
  reason: string | null;
  createdAt: string;
  expiresAt: string;
};

export type CreditTransactionType = 'purchase' | 'consume' | 'adjust';

export type CreditRecord = {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransactionRecord = {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  reason: string;
  relatedMatchId: string | null;
  createdAt: string;
};

export type RiskCheckRecord = {
  id: string;
  userId: string;
  status: RiskCheckStatus;
  searchedAt: string;
  searchKeywords: string[];
  hitCount: number;
  sourceUrls: string[];
  adminMemo: string | null;
  finalDeciderId: string | null;
  decidedAt: string | null;
};

export type MatchRecord = {
  id: string;
  userAId: string;
  userBId: string;
  relationshipStatus: 'active' | 'relationship_mode' | 'scheduled_delete' | 'deleted';
  relationshipStartedAt: string | null;
  scheduledDeleteAt: string | null;
  holdDeletion: boolean;
  createdAt: string;
};

export type MessageRecord = {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type MessageReadRecord = {
  userId: string;
  matchId: string;
  lastReadAt: string;
};

export type ReportRecord = {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: string;
  reasonType: ReportReasonType;
  detail: string;
  status: ReportStatus;
  createdAt: string;
};

export type BlockRecord = {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  createdAt: string;
};

export type AdminActionLog = {
  id: string;
  adminUserId: string;
  targetUserId: string;
  actionType: AdminActionType;
  beforeValue: string | null;
  afterValue: string | null;
  note: string | null;
  createdAt: string;
};

export type AppAccessState = 'approved' | 'pending' | 'rejected' | 'suspended';
