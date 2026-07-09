export type AdminMemberStatus = 'active' | 'warning' | 'suspended' | 'deleted';

export type AdminMemberRow = {
  id: string;
  nickname: string;
  age: number;
  gender: string;
  genderLabel: string;
  area: string;
  lifePhase: string;
  lifePhaseLabel: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  status: AdminMemberStatus;
  deletedAt: string | null;
  identityStatus: 'verified' | 'reviewing' | 'unverified';
  identityStatusLabel: string;
};

export type AdminEventRow = {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  hostName: string;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  applicationCount: number;
  confirmedCount: number;
  status: string;
  isPast: boolean;
  visibilityLabel: string;
  recruitmentType: 'standard' | 'additional';
  recruitmentLabel: string;
};

export type AdminApplicationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  memberId: string;
  memberNickname: string;
  reason?: string;
  appliedAt: string;
  status: 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'cancelled';
  decidedAt: string | null;
  decisionNote?: string | null;
};

export type AdminReportStatus = 'new' | 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type AdminReportTargetType =
  | 'member'
  | 'event'
  | 'profile'
  | 'message_future'
  | 'other'
  | 'group_post'
  | 'group_photo'
  | 'profile_photo'
  | 'event_photo';

export type AdminReportRow = {
  id: string;
  reporterMemberId: string | null;
  reporterNickname: string;
  targetType: AdminReportTargetType;
  targetId: string;
  targetMemberId: string | null;
  targetMemberNickname: string | null;
  targetEventId: string | null;
  targetEventTitle: string | null;
  targetLabel: string;
  category: string;
  categoryLabel: string;
  reason: string;
  description: string;
  detail: string;
  status: AdminReportStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedByMemberId: string | null;
  resolvedByNickname: string | null;
};

export type AdminMemberApplicationHistory = {
  id: string;
  eventId: string;
  eventTitle: string;
  status: 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'cancelled';
  appliedAt: string;
  decidedAt: string | null;
};

export type AdminMemberGroupHistory = {
  groupId: string;
  eventId: string;
  eventTitle: string;
  role: string;
  joinedAt: string;
};

export type AdminMemberDetail = {
  member: AdminMemberRow;
  bio: string;
  occupation: string;
  purposes: string[];
  purposeLabels: string[];
  interestTags: string[];
  interestLabels: string[];
  valueTags: string[];
  valueTagLabels: string[];
  personalityType: string | null;
  personalityLabel: string | null;
  mbtiType: string | null;
  mbtiLabel: string | null;
  socialLinks: { platform: string; platformLabel: string; url: string; isVisibleOnProfile: boolean }[];
  introductionAiGenerated: boolean;
  introductionGeneratedAt: string | null;
  deepAnswers: { label: string; value: string }[];
  desiredConnection: string;
  considerations: string;
  safetyFlags: string[];
  trustNotes: string | null;
  identityVerified: boolean;
  documentUploadStatus: string;
  trustVerificationStatus: string;
  verificationSource: string;
  adminNotePhase: 'phase3';
  applicationHistory: AdminMemberApplicationHistory[];
  confirmedEvents: { id: string; title: string; startAt: string }[];
  hostedEvents: { id: string; title: string; startAt: string }[];
  groupHistory: AdminMemberGroupHistory[];
  postCount: number;
  photoCount: number;
  reportCount: number;
};

export type AdminKpiValue = number | 'unlinked';

export type HanakaiAdminDashboard = {
  kpis: {
    memberCount: number;
    eventCount: number;
    upcomingEventCount: number;
    applicationCount: number;
    pendingApplicationCount: number;
    reportCount: AdminKpiValue;
    photoUsageRequestCount: AdminKpiValue;
    groupPostCount: AdminKpiValue;
  };
  recentMembers: AdminMemberRow[];
  recentEvents: AdminEventRow[];
  recentApplications: AdminApplicationRow[];
  pendingApplications: AdminApplicationRow[];
  upcomingEvents: AdminEventRow[];
};
