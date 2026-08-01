// HANAKAI Connection — /admin 運営管理のモックデータ層（インメモリ）。
// 将来的に Supabase へ移行しやすいよう、純粋な配列 + アクセサ + ミューテータで構成する。

import { EVENT_CATEGORY_LABEL } from '@/lib/connection/data';
import { SEED_MEMBER_AVATARS } from '@/lib/connection/mock-profile-assets';
import type {
  AdminEvent,
  AdminEventStatus,
  AdminKpi,
  AdminUser,
  ConnectionHistory,
  EventReview,
  HostApplication,
  HostStatus,
  UserStatus,
  VerificationStatus,
} from '@/lib/connection/admin-types';

const img = (id: string, w = 200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// --- ラベル ---

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: '未確認',
  reviewing: '確認中',
  verified: '運営確認済み',
  assured: '安心確認済み',
  rejected: '却下',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: '正常',
  review: '要確認',
  suspended: '一時停止',
  banned: '強制退会',
};

export const HOST_STATUS_LABEL: Record<HostStatus, string> = {
  none: '未申請',
  applied: '申請中',
  community: 'Community Host',
  trusted: 'Trusted Host',
  premium: 'Premium Host',
  suspended: '停止中',
  rejected: '却下',
};

export const ADMIN_EVENT_STATUS_LABEL: Record<AdminEventStatus, string> = {
  draft: '下書き',
  under_review: '運営審査中',
  published: '公開',
  returned: '差戻し',
  unpublished: '非公開',
  completed: '終了',
};

export const GENDER_LABEL: Record<'female' | 'male' | 'other', string> = {
  female: '女性',
  male: '男性',
  other: 'その他',
};

// --- シードデータ ---

let adminUsers: AdminUser[] = [
  {
    id: 'm1',
    nickname: 'あやか',
    age: 32,
    gender: 'female',
    area: '東京・渋谷',
    occupation: 'ブランドマネージャー',
    avatarUrl: SEED_MEMBER_AVATARS.m1,
    verification: 'assured',
    participationCount: 5,
    hostingCount: 1,
    connectionCount: 9,
    reunionRate: 0.6,
    hostStatus: 'trusted',
    reportCount: 0,
    status: 'active',
    adminNote: '本人確認書類・公開情報を確認済み。安心して任せられる。',
  },
  {
    id: 'm2',
    nickname: '健太',
    age: 38,
    gender: 'male',
    area: '東京・目黒',
    occupation: 'スタートアップ経営',
    avatarUrl: SEED_MEMBER_AVATARS.m2,
    verification: 'assured',
    participationCount: 3,
    hostingCount: 2,
    connectionCount: 7,
    reunionRate: 0.43,
    hostStatus: 'premium',
    reportCount: 0,
    status: 'active',
    adminNote: '主催実績良好。参加者満足度も高い。',
  },
  {
    id: 'm3',
    nickname: '美咲',
    age: 28,
    gender: 'female',
    area: '神奈川・横浜',
    occupation: 'UIデザイナー',
    avatarUrl: SEED_MEMBER_AVATARS.m3,
    verification: 'verified',
    participationCount: 2,
    hostingCount: 0,
    connectionCount: 4,
    reunionRate: 0.5,
    hostStatus: 'applied',
    reportCount: 0,
    status: 'active',
    adminNote: '',
  },
  {
    id: 'm4',
    nickname: '大輔',
    age: 45,
    gender: 'male',
    area: '東京・世田谷',
    occupation: 'コンサルタント',
    avatarUrl: SEED_MEMBER_AVATARS.m4,
    verification: 'unverified',
    participationCount: 1,
    hostingCount: 0,
    connectionCount: 2,
    reunionRate: 0,
    hostStatus: 'rejected',
    reportCount: 1,
    status: 'review',
    adminNote: '本人確認未提出。参加態度に関する申し送りを確認中。',
  },
  {
    id: 'm5',
    nickname: 'ゆい',
    age: 34,
    gender: 'female',
    area: '東京・表参道',
    occupation: 'フリーランスライター',
    avatarUrl: SEED_MEMBER_AVATARS.m5,
    verification: 'reviewing',
    participationCount: 1,
    hostingCount: 0,
    connectionCount: 3,
    reunionRate: 0.33,
    hostStatus: 'applied',
    reportCount: 0,
    status: 'active',
    adminNote: '',
  },
  {
    id: 'm6',
    nickname: '翔',
    age: 29,
    gender: 'male',
    area: '東京・中目黒',
    occupation: 'エンジニア',
    avatarUrl: SEED_MEMBER_AVATARS.m6,
    verification: 'verified',
    participationCount: 2,
    hostingCount: 0,
    connectionCount: 5,
    reunionRate: 0.4,
    hostStatus: 'none',
    reportCount: 0,
    status: 'active',
    adminNote: '',
  },
  {
    id: 'm7',
    nickname: '理沙',
    age: 41,
    gender: 'female',
    area: '東京・恵比寿',
    occupation: '事業開発',
    avatarUrl: SEED_MEMBER_AVATARS.m7,
    verification: 'assured',
    participationCount: 3,
    hostingCount: 1,
    connectionCount: 6,
    reunionRate: 0.5,
    hostStatus: 'applied',
    reportCount: 0,
    status: 'active',
    adminNote: '',
  },
  {
    id: 'm8',
    nickname: '拓也',
    age: 36,
    gender: 'male',
    area: '神奈川・鎌倉',
    occupation: '地域商店経営',
    avatarUrl: SEED_MEMBER_AVATARS.m8,
    verification: 'verified',
    participationCount: 2,
    hostingCount: 0,
    connectionCount: 4,
    reunionRate: 0.25,
    hostStatus: 'none',
    reportCount: 2,
    status: 'review',
    adminNote: '参加者から2件の申し送り。次回参加時に様子を確認。',
  },
];

let adminEvents: AdminEvent[] = [
  {
    id: 'ue1',
    title: '朝の花あしらいと珈琲 — 南青山',
    category: 'flower',
    hostId: 'm1',
    hostName: 'あやか',
    startAt: '2026-07-12T10:00:00+09:00',
    area: '東京・南青山',
    venue: 'アトリエ&カフェ AOYAMA',
    capacity: 6,
    fee: 3500,
    approvalMode: 'host_approval',
    createdAt: '2026-06-23T09:00:00+09:00',
    status: 'under_review',
    selectedMemberIds: ['m3', 'm5', 'm7'],
    adminNote: '',
  },
  {
    id: 'ue2',
    title: '夜の読書会 — 代官山',
    category: 'learning',
    hostId: 'm7',
    hostName: '理沙',
    startAt: '2026-07-18T19:30:00+09:00',
    area: '東京・代官山',
    venue: 'BOOK LOUNGE DAIKANYAMA',
    capacity: 8,
    fee: 2000,
    approvalMode: 'host_approval',
    createdAt: '2026-06-25T14:00:00+09:00',
    status: 'under_review',
    selectedMemberIds: ['m1', 'm3', 'm6'],
    adminNote: '',
  },
  {
    id: 'ue3',
    title: '週末ランニング & ブランチ — 皇居',
    category: 'sports',
    hostId: 'm2',
    hostName: '健太',
    startAt: '2026-07-20T08:00:00+09:00',
    area: '東京・皇居周辺',
    venue: '桜田門スタート',
    capacity: 10,
    fee: 0,
    approvalMode: 'auto',
    createdAt: '2026-06-20T11:00:00+09:00',
    status: 'returned',
    returnReason: '定員10名は初回としては多めです。少人数での開催をご検討ください。',
    selectedMemberIds: ['m2', 'm4', 'm6'],
    adminNote: '差戻し済み。再申請待ち。',
  },
  {
    id: 'ue4',
    title: 'はじめての日本酒の会 — 神楽坂',
    category: 'bar',
    hostId: 'm5',
    hostName: 'ゆい',
    startAt: '2026-07-25T19:00:00+09:00',
    area: '東京・神楽坂',
    venue: '（調整中）',
    capacity: 6,
    fee: 4500,
    approvalMode: 'host_approval',
    createdAt: '2026-06-26T20:00:00+09:00',
    status: 'draft',
    selectedMemberIds: [],
    adminNote: '',
  },
  {
    id: 'ce6',
    title: 'Coffee Connection — 横浜',
    category: 'coffee',
    hostId: null,
    hostName: 'HANAKAI Connection 運営',
    startAt: '2026-06-08T19:00:00+09:00',
    area: '神奈川・横浜',
    venue: 'YOKOHAMA CONNECTION CAFE',
    capacity: 6,
    fee: 3000,
    approvalMode: 'host_approval',
    createdAt: '2026-05-20T10:00:00+09:00',
    status: 'completed',
    selectedMemberIds: ['m1', 'm3', 'm5', 'm6', 'm7', 'm8'],
    adminNote: '',
  },
];

let hostApplications: HostApplication[] = [
  {
    id: 'ha1',
    memberId: 'm3',
    verification: 'verified',
    participationCount: 2,
    hostingCount: 0,
    averageReview: 4.6,
    reportCount: 0,
    reason:
      'デザインの仕事柄、ものづくりの場をつくるのが好きです。少人数で落ち着いた手しごとの会を開いてみたいと思い、申請しました。',
    adminNote: '',
    status: 'applied',
    appliedAt: '2026-06-22T10:00:00+09:00',
    agreedGuidelines: true,
  },
  {
    id: 'ha2',
    memberId: 'm5',
    verification: 'reviewing',
    participationCount: 1,
    hostingCount: 0,
    averageReview: 4.2,
    reportCount: 0,
    reason: '書くことを通じて人とつながる場をつくりたいです。まずは小さな読書会から始めたいと考えています。',
    adminNote: '本人確認の完了待ち。',
    status: 'applied',
    appliedAt: '2026-06-24T12:00:00+09:00',
    agreedGuidelines: true,
  },
  {
    id: 'ha3',
    memberId: 'm7',
    verification: 'assured',
    participationCount: 3,
    hostingCount: 1,
    averageReview: 4.8,
    reportCount: 0,
    reason: '事業開発の経験を活かし、異なる背景の方が安心して話せる場を継続的に開きたいです。',
    adminNote: '実績・評価ともに良好。',
    status: 'applied',
    appliedAt: '2026-06-21T09:30:00+09:00',
    agreedGuidelines: true,
  },
  {
    id: 'ha4',
    memberId: 'm4',
    verification: 'unverified',
    participationCount: 1,
    hostingCount: 0,
    averageReview: 3.2,
    reportCount: 1,
    reason: 'ビジネス系の交流会を開きたい。',
    adminNote: '本人確認未提出・申し送りあり。今回は見送り。',
    status: 'rejected',
    appliedAt: '2026-06-15T18:00:00+09:00',
    agreedGuidelines: false,
  },
  {
    id: 'ha5',
    memberId: 'm1',
    verification: 'assured',
    participationCount: 5,
    hostingCount: 1,
    averageReview: 4.9,
    reportCount: 0,
    reason: '花を介した穏やかなつながりの場を続けたいです。',
    adminNote: 'Trusted Host として承認済み。',
    status: 'trusted',
    appliedAt: '2026-05-30T10:00:00+09:00',
    agreedGuidelines: true,
  },
  {
    id: 'ha6',
    memberId: 'm2',
    verification: 'assured',
    participationCount: 3,
    hostingCount: 2,
    averageReview: 4.7,
    reportCount: 0,
    reason: '異業種の人がゆるくつながる場を継続して開催したい。',
    adminNote: 'Premium Host。継続的に上質な体験を提供。',
    status: 'premium',
    appliedAt: '2026-05-10T10:00:00+09:00',
    agreedGuidelines: true,
  },
];

const connectionHistories: ConnectionHistory[] = [
  {
    id: 'ch1',
    memberAId: 'm1',
    memberBId: 'm5',
    meetingCount: 3,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6', 'ce5', 'ce2'],
    mutualReunionWish: true,
    note: '毎回会話が弾んでいる。相性が良い。',
  },
  {
    id: 'ch2',
    memberAId: 'm1',
    memberBId: 'm3',
    meetingCount: 2,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6', 'ce5'],
    mutualReunionWish: true,
  },
  {
    id: 'ch3',
    memberAId: 'm1',
    memberBId: 'm6',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
  {
    id: 'ch4',
    memberAId: 'm1',
    memberBId: 'm7',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
  {
    id: 'ch5',
    memberAId: 'm3',
    memberBId: 'm5',
    meetingCount: 2,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6', 'ce5'],
    mutualReunionWish: false,
  },
  {
    id: 'ch6',
    memberAId: 'm5',
    memberBId: 'm7',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
    mutualReunionWish: true,
  },
  {
    id: 'ch7',
    memberAId: 'm6',
    memberBId: 'm8',
    meetingCount: 2,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6', 'ce5'],
  },
  {
    id: 'ch8',
    memberAId: 'm3',
    memberBId: 'm7',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
  {
    id: 'ch9',
    memberAId: 'm7',
    memberBId: 'm8',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
  {
    id: 'ch10',
    memberAId: 'm2',
    memberBId: 'm4',
    meetingCount: 1,
    lastMetAt: '2026-07-08T07:30:00+09:00',
    lastEventId: 'ce5',
    eventIds: ['ce5'],
  },
  {
    id: 'ch11',
    memberAId: 'm5',
    memberBId: 'm6',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
  {
    id: 'ch12',
    memberAId: 'm6',
    memberBId: 'm7',
    meetingCount: 1,
    lastMetAt: '2026-06-08T19:00:00+09:00',
    lastEventId: 'ce6',
    eventIds: ['ce6'],
  },
];

let eventReviews: EventReview[] = [
  {
    id: 'rv1',
    eventId: 'ce6',
    respondentId: 'm1',
    satisfaction: 5,
    wantAgain: true,
    wantToMeetAgainIds: ['m5', 'm3'],
    newPerspective: true,
    hostImpression: 5,
    freeText: '少人数だったので一人ひとりとちゃんと話せました。また参加したいです。',
    needsAttention: false,
    createdAt: '2026-06-09T09:00:00+09:00',
  },
  {
    id: 'rv2',
    eventId: 'ce6',
    respondentId: 'm3',
    satisfaction: 4,
    wantAgain: true,
    wantToMeetAgainIds: ['m1'],
    newPerspective: true,
    hostImpression: 4,
    freeText: '普段出会わない職種の方と話せて刺激になりました。',
    needsAttention: false,
    createdAt: '2026-06-09T10:30:00+09:00',
  },
  {
    id: 'rv3',
    eventId: 'ce6',
    respondentId: 'm7',
    satisfaction: 2,
    wantAgain: false,
    wantToMeetAgainIds: [],
    newPerspective: false,
    hostImpression: 2,
    freeText: '一人だけ場の雰囲気に合わない発言が続き、少し居心地が悪かったです。',
    needsAttention: true,
    createdAt: '2026-06-09T12:00:00+09:00',
  },
  {
    id: 'rv4',
    eventId: 'ce6',
    respondentId: 'm8',
    satisfaction: 4,
    wantAgain: true,
    wantToMeetAgainIds: ['m6'],
    newPerspective: true,
    hostImpression: 4,
    freeText: '落ち着いた良い時間でした。',
    needsAttention: false,
    createdAt: '2026-06-09T13:15:00+09:00',
  },
  {
    id: 'rv5',
    eventId: 'ce6',
    respondentId: 'm5',
    satisfaction: 5,
    wantAgain: true,
    wantToMeetAgainIds: ['m1', 'm6'],
    newPerspective: true,
    hostImpression: 5,
    freeText: 'また同じメンバーで集まりたいです。',
    needsAttention: false,
    createdAt: '2026-06-09T14:40:00+09:00',
  },
];

// --- アクセサ ---

export function listAdminUsers() {
  return [...adminUsers];
}

export function getAdminUser(id: string) {
  return adminUsers.find((u) => u.id === id) ?? null;
}

export function listAdminEvents() {
  return [...adminEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAdminEvent(id: string) {
  return adminEvents.find((e) => e.id === id) ?? null;
}

export function listHostApplications() {
  return [...hostApplications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export function getHostApplication(id: string) {
  return hostApplications.find((a) => a.id === id) ?? null;
}

export function listConnectionHistories() {
  return [...connectionHistories];
}

export function listEventReviews() {
  return [...eventReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function categoryLabel(category: AdminEvent['category']) {
  return EVENT_CATEGORY_LABEL[category];
}

// --- KPI ---

export function getAdminKpi(): AdminKpi {
  const verifiedUsers = adminUsers.filter((u) => u.verification === 'verified' || u.verification === 'assured').length;
  const usersNeedingReview = adminUsers.filter((u) => u.status === 'review' || u.reportCount > 0).length;
  const hostApplicationCount = hostApplications.filter((a) => a.status === 'applied').length;
  // 承認率：これまでの参加申請のうち、承認（確定）された割合（モック）
  const approvalRate = 0.78;
  const monthlyApplications = 24;
  return {
    totalUsers: adminUsers.length,
    verifiedUsers,
    totalEvents: adminEvents.length,
    monthlyApplications,
    approvalRate,
    connectionsFormed: connectionHistories.length,
    hostApplications: hostApplicationCount,
    usersNeedingReview,
  };
}

// --- Connection 設計補助 ---

export function getMeeting(aId: string, bId: string): ConnectionHistory | null {
  return (
    connectionHistories.find(
      (c) =>
        (c.memberAId === aId && c.memberBId === bId) || (c.memberAId === bId && c.memberBId === aId),
    ) ?? null
  );
}

export type SelectionStats = {
  selectedCount: number;
  capacity: number;
  firstTimers: number;
  repeaters: number;
  /** 新しいConnection率（初対面ペア / 全ペア） */
  newConnectionRate: number;
  totalPairs: number;
  newPairs: number;
};

/** 選定中メンバーの統計（初参加 / リピーター / 新しいConnection率） */
export function getSelectionStats(memberIds: string[], capacity: number): SelectionStats {
  let firstTimers = 0;
  let repeaters = 0;
  for (const id of memberIds) {
    const user = getAdminUser(id);
    if (user && user.participationCount <= 1) firstTimers += 1;
    else repeaters += 1;
  }
  let totalPairs = 0;
  let newPairs = 0;
  for (let i = 0; i < memberIds.length; i += 1) {
    for (let j = i + 1; j < memberIds.length; j += 1) {
      totalPairs += 1;
      const meeting = getMeeting(memberIds[i], memberIds[j]);
      if (!meeting || meeting.meetingCount === 0) newPairs += 1;
    }
  }
  return {
    selectedCount: memberIds.length,
    capacity,
    firstTimers,
    repeaters,
    newConnectionRate: totalPairs === 0 ? 1 : newPairs / totalPairs,
    totalPairs,
    newPairs,
  };
}

export type DuplicateAlert = { level: 'warn' | 'info'; message: string };

/** 重複アラート（既に会ったことがある組み合わせを検出） */
export function getDuplicateAlerts(memberIds: string[]): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = [];
  for (let i = 0; i < memberIds.length; i += 1) {
    for (let j = i + 1; j < memberIds.length; j += 1) {
      const meeting = getMeeting(memberIds[i], memberIds[j]);
      if (!meeting || meeting.meetingCount === 0) continue;
      const a = getAdminUser(memberIds[i])?.nickname ?? memberIds[i];
      const b = getAdminUser(memberIds[j])?.nickname ?? memberIds[j];
      if (meeting.meetingCount >= 2) {
        alerts.push({ level: 'warn', message: `${a} と ${b} は過去${meeting.meetingCount}回同席しています` });
      } else {
        alerts.push({ level: 'info', message: `${a} と ${b} は前回イベントでも同席しています` });
      }
    }
  }
  const stats = getSelectionStats(memberIds, 0);
  if (stats.totalPairs > 0 && stats.newConnectionRate < 0.5) {
    alerts.push({
      level: 'warn',
      message: `初対面率が低くなっています（新しいConnection率 ${Math.round(stats.newConnectionRate * 100)}%）`,
    });
  }
  return alerts;
}

// --- ミューテータ（モック更新・インメモリ） ---

export function setUserVerification(id: string, verification: VerificationStatus) {
  const u = getAdminUser(id);
  if (u) u.verification = verification;
}

export function setUserStatus(id: string, status: UserStatus) {
  const u = getAdminUser(id);
  if (u) u.status = status;
}

export function setUserHostStatus(id: string, hostStatus: HostStatus) {
  const u = getAdminUser(id);
  if (u) u.hostStatus = hostStatus;
}

export function setUserNote(id: string, note: string) {
  const u = getAdminUser(id);
  if (u) u.adminNote = note;
}

export function setAdminEventStatus(id: string, status: AdminEventStatus, returnReason?: string) {
  const e = getAdminEvent(id);
  if (!e) return;
  e.status = status;
  if (status === 'returned' && returnReason !== undefined) e.returnReason = returnReason;
}

export function setAdminEventNote(id: string, note: string) {
  const e = getAdminEvent(id);
  if (e) e.adminNote = note;
}

export function setHostApplicationStatus(id: string, status: HostStatus) {
  const a = getHostApplication(id);
  if (!a) return;
  a.status = status;
  // ユーザー側の Host ステータスも同期（モック）
  if (status === 'community' || status === 'trusted' || status === 'premium' || status === 'suspended' || status === 'rejected') {
    setUserHostStatus(a.memberId, status);
  }
}

export function setHostApplicationNote(id: string, note: string) {
  const a = getHostApplication(id);
  if (a) a.adminNote = note;
}
