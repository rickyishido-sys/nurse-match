// HANAKAI Connection — Timeleft-inspired real meetup MVP (mock-backed).

export type ConnectionEventCategory =
  | 'flower'
  | 'coffee'
  | 'business'
  | 'walking'
  | 'fitness';

export type ConnectionEventStatus = 'open' | 'almost_full' | 'full' | 'closed' | 'completed';

export type ConnectionMotivation =
  | 'new_friends'
  | 'entrepreneurs'
  | 'hobby'
  | 'community'
  | 'startup'
  | 'lonely'
  | 'more_connections';

export type ConnectionMember = {
  id: string;
  nickname: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  area: string;
  occupation: string;
  bio: string;
  avatarUrl: string;
  motivations: ConnectionMotivation[];
};

export type ConnectionEvent = {
  id: string;
  title: string;
  category: ConnectionEventCategory;
  startAt: string;
  area: string;
  venue: string;
  capacity: number; // 募集人数（通常6名）
  reservedCount: number;
  hostName: string;
  conditions: string;
  description: string;
  coverUrl: string;
  status: ConnectionEventStatus;
  /** イベント終了後、参加者だけが閲覧できる Connection ページを開く */
  isPast: boolean;
  /** 確定した参加者ID（運営が手動選定） */
  confirmedMemberIds: string[];
};

export type EventApplication = {
  id: string;
  eventId: string;
  memberId: string;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
};
