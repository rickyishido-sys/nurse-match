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
};

export type AdminApplicationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  memberId: string;
  memberNickname: string;
  reason?: string;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  decidedAt: string | null;
  decisionNote?: string | null;
};

export type AdminReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type AdminReportTargetType =
  | 'member'
  | 'event'
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
  targetLabel: string;
  reason: string;
  detail: string;
  status: AdminReportStatus;
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
  status: 'pending' | 'confirmed' | 'rejected';
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
