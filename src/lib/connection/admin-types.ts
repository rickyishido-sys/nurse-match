// HANAKAI Connection — 運営管理（/admin）向けのモック型定義。
// 将来的に Supabase へ移行しやすいよう、ID 参照・ISO日付文字列・列挙型で表現する。
// 既存の ConnectionMember / ConnectionEvent と重複する表示情報はスナップショットとして保持する。

import type { ConnectionEventCategory, EventApprovalMode } from '@/lib/connection/types';

/** 本人確認状態（「Trust Verification」という表現は用いない） */
export type VerificationStatus =
  | 'unverified' // 未確認
  | 'reviewing' // 確認中
  | 'verified' // 運営確認済み
  | 'assured' // 安心確認済み
  | 'rejected'; // 却下

/** アカウント状態 */
export type UserStatus =
  | 'active' // 正常
  | 'review' // 要確認
  | 'suspended' // 一時停止
  | 'banned'; // 強制退会

/** Hostステータス */
export type HostStatus =
  | 'none' // 未申請
  | 'applied' // 申請中
  | 'community' // Community Host
  | 'trusted' // Trusted Host
  | 'premium' // Premium Host
  | 'suspended' // 停止中
  | 'rejected'; // 却下

/** 運営から見たイベントの審査ステータス */
export type AdminEventStatus =
  | 'draft' // 下書き
  | 'under_review' // 運営審査中
  | 'published' // 公開
  | 'returned' // 差戻し
  | 'unpublished' // 非公開
  | 'completed'; // 終了

export type AdminUser = {
  id: string;
  nickname: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  area: string;
  occupation: string;
  avatarUrl: string;
  verification: VerificationStatus;
  /** 参加回数 */
  participationCount: number;
  /** 主催回数 */
  hostingCount: number;
  /** Connection数（これまでに出会った人数） */
  connectionCount: number;
  /** 再会率（0〜1） */
  reunionRate: number;
  hostStatus: HostStatus;
  /** 通報件数 */
  reportCount: number;
  status: UserStatus;
  adminNote: string;
};

export type AdminEvent = {
  id: string;
  title: string;
  category: ConnectionEventCategory;
  hostId: string | null;
  hostName: string;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  fee: number;
  approvalMode: EventApprovalMode;
  createdAt: string;
  status: AdminEventStatus;
  /** 差戻し理由 */
  returnReason?: string;
  adminNote?: string;
  /** 選定中／確定メンバー（Connection設計補助で使用） */
  selectedMemberIds: string[];
};

export type HostApplication = {
  id: string;
  memberId: string;
  verification: VerificationStatus;
  participationCount: number;
  hostingCount: number;
  /** 平均レビュー（5点満点） */
  averageReview: number;
  reportCount: number;
  /** 申請理由 */
  reason: string;
  adminNote: string;
  status: HostStatus;
  appliedAt: string;
  /** コミュニティガイドライン同意 */
  agreedGuidelines: boolean;
};

export type ConnectionHistory = {
  id: string;
  memberAId: string;
  memberBId: string;
  meetingCount: number;
  lastMetAt: string;
  lastEventId: string;
  eventIds: string[];
  /** 両者がまた会いたいと回答しているか */
  mutualReunionWish?: boolean;
  note?: string;
};

export type EventReview = {
  id: string;
  eventId: string;
  respondentId: string;
  /** 満足度（5点満点） */
  satisfaction: number;
  /** また参加したいか */
  wantAgain: boolean;
  /** また会いたい人（memberId） */
  wantToMeetAgainIds: string[];
  /** 新しい視点を得られたか */
  newPerspective: boolean;
  /** 主催者の印象（5点満点） */
  hostImpression: number;
  /** 自由記述 */
  freeText: string;
  /** 運営要確認フラグ */
  needsAttention: boolean;
  createdAt: string;
};

export type AdminKpi = {
  totalUsers: number;
  verifiedUsers: number;
  totalEvents: number;
  monthlyApplications: number;
  approvalRate: number;
  connectionsFormed: number;
  hostApplications: number;
  usersNeedingReview: number;
};
