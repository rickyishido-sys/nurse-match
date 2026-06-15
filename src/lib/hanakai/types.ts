// HANAKAI / 花会 domain types (MVP, mock-backed).
// リアル花会 → デジタルコミュニティ → リアル花会 の循環を表現するための型。

export type InstructorStage =
  | 'participant' // 参加者
  | 'regular' // 常連
  | 'support' // 運営補助
  | 'candidate' // 講師候補
  | 'certified' // 認定講師
  | 'area_lead'; // エリア責任者

export type ConnectionKind = 'follow' | 'curious' | 'cheer' | 'meet';

export type SupportCategory =
  | 'instructor' // 講師になりたい
  | 'area' // 地域花会を立ち上げたい
  | 'shop' // 花屋を開きたい
  | 'learn' // 花を学びたい
  | 'spread'; // 花会を広げたい

export type LiveCategory =
  | 'hanakai' // 花会ライブ
  | 'challenge' // 講師チャレンジライブ
  | 'area_launch' // 地域花会立ち上げライブ
  | 'shop' // 花屋開業ライブ
  | 'study' // 花留学ライブ
  | 'report' // 花会開催レポートライブ
  | 'dream'; // 夢応援ライブ

export type EventCategory =
  | 'day' // 昼の花会
  | 'night' // 夜の花会
  | 'alcohol' // お酒あり花会
  | 'business' // 経営者花会
  | 'parent_child' // 親子花会
  | 'senior' // シニア花会
  | 'area_launch'; // 地域立ち上げ花会

export type EventStatus = 'open' | 'almost_full' | 'full' | 'closed';

export type HanakaiUser = {
  id: string;
  handle: string;
  nickname: string;
  age: number | null;
  gender: 'female' | 'male' | 'other' | 'unspecified';
  area: string;
  bio: string;
  interestTags: string[];
  purpose: string; // 花会参加目的
  avatarUrl: string;
  instructorStage: InstructorStage;
  joinedEventCount: number;
  postCount: number;
  followerCount: number;
  cheerPoints: number; // 受け取った応援ポイント
  isCertified: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorId: string;
  imageUrl: string;
  title: string;
  body: string;
  flowersUsed: string[]; // 使用した花
  eventId: string | null; // 参加した花会
  tags: string[];
  likeCount: number;
  createdAt: string;
};

export type HanakaiEvent = {
  id: string;
  title: string;
  category: EventCategory;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  reservedCount: number;
  fee: number; // 円
  description: string;
  hostId: string; // 講師
  hasAlcohol: boolean;
  coverUrl: string;
  status: EventStatus;
  recommended: boolean;
};

export type Live = {
  id: string;
  title: string;
  category: LiveCategory;
  hostId: string;
  scheduledAt: string;
  isLiveNow: boolean;
  viewerCount: number;
  cheerTotal: number; // 集まった応援(投げ花)
  coverUrl: string;
  description: string;
};

export type SupportProject = {
  id: string;
  ownerId: string;
  title: string;
  category: SupportCategory;
  summary: string;
  story: string;
  goalAmount: number;
  raisedAmount: number;
  supporterCount: number;
  coverUrl: string;
  payoutRate: number; // 本人に届く割合 (0-1)
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
};
