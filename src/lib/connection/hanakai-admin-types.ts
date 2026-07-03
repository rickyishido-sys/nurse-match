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
