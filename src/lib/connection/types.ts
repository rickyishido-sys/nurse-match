// HANAKAI Connection — profile & grouping data model (mock-backed).
// Designed for future AI-assisted participant selection: values, interests,
// life phase, and personality type — not just age/gender/occupation.

export type ConnectionEventCategory =
  | 'flower'
  | 'coffee'
  | 'business'
  | 'walking'
  | 'fitness';

export type ConnectionEventStatus = 'open' | 'almost_full' | 'full' | 'closed' | 'completed';

/** Connection目的（複数選択） */
export type ConnectionPurpose =
  | 'new_friends'
  | 'hobby_buddies'
  | 'life_stimulus'
  | 'learning'
  | 'mutual_support'
  | 'cross_industry'
  | 'local_community'
  | 'other';

/** 興味関心タグ（複数選択） */
export type InterestTag =
  | 'flowers'
  | 'coffee'
  | 'walking'
  | 'art'
  | 'reading'
  | 'movies'
  | 'music'
  | 'startup'
  | 'management'
  | 'investment'
  | 'sports'
  | 'fitness'
  | 'travel'
  | 'photography'
  | 'ai'
  | 'other';

/** 人生フェーズ（単一選択） */
export type LifePhase =
  | 'student'
  | 'employee'
  | 'executive'
  | 'freelance'
  | 'pre_startup'
  | 'job_change'
  | 'parenting'
  | 'second_career'
  | 'retired'
  | 'other';

/** 性格タイプ（簡易診断結果） */
export type PersonalityType = 'explorer' | 'creator' | 'supporter' | 'challenger';

export type PersonalityAxes = {
  energy: 'extravert' | 'introvert';
  thinking: 'logic' | 'feeling';
  planning: 'plan' | 'flexible';
};

/** 価値観・人生観（自由記述） */
export type ProfileValues = {
  mostImportant: string;
  currentChallenge: string;
  futureGoal: string;
  recentInspiration: string;
  howOthersSeeMe: string;
  personalityOneWord: string;
  coreValues: string;
};

export type PersonalityProfile = {
  type: PersonalityType;
  axes: PersonalityAxes;
  completedAt: string;
};

export type ConnectionMember = {
  id: string;
  nickname: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  area: string;
  occupation: string;
  bio: string;
  avatarUrl: string;
  values: ProfileValues;
  purposes: ConnectionPurpose[];
  interestTags: InterestTag[];
  lifePhase: LifePhase;
  personality: PersonalityProfile | null;
};

export type ConnectionEvent = {
  id: string;
  title: string;
  category: ConnectionEventCategory;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  reservedCount: number;
  hostName: string;
  conditions: string;
  description: string;
  coverUrl: string;
  status: ConnectionEventStatus;
  isPast: boolean;
  confirmedMemberIds: string[];
};

export type EventApplication = {
  id: string;
  eventId: string;
  memberId: string;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
};

/** AI grouping 用の正規化スナップショット（将来の選定API向け） */
export type MemberGroupingProfile = {
  memberId: string;
  demographics: { age: number; gender: string; occupation: string; lifePhase: LifePhase };
  values: ProfileValues;
  purposes: ConnectionPurpose[];
  interestTags: InterestTag[];
  personality: PersonalityProfile | null;
};
