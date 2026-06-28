// HANAKAI Connection — profile & grouping data model (mock-backed).
// Designed for future AI-assisted participant selection: values, interests,
// life phase, and personality type — not just age/gender/occupation.

export type ConnectionEventCategory =
  | 'flower'
  | 'coffee'
  | 'business'
  | 'walking'
  | 'fitness'
  | 'learning'
  | 'bar'
  | 'sports'
  | 'workshop'
  | 'other';

export type ConnectionEventStatus = 'open' | 'almost_full' | 'full' | 'closed' | 'completed';

/** 参加申請の承認方式 */
export type EventApprovalMode = 'host_approval' | 'auto';

/**
 * Hostバッジ（現時点ではUI/ダミーデータのみ。将来は開催実績・評価・本人確認の
 * 組み合わせで自動付与することを想定）
 */
export type HostBadge = 'community' | 'trusted' | 'premium';

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

/** 価値観タグ（複数選択） */
export type ValueTag =
  | 'freedom'
  | 'challenge'
  | 'stability'
  | 'family'
  | 'fellowship'
  | 'growth'
  | 'creation'
  | 'contribution'
  | 'learning'
  | 'health'
  | 'work'
  | 'travel'
  | 'aesthetics';

/** 価値観・人生観（タグ + 自由記述） */
export type ProfileValues = {
  mostImportant: string;
  currentChallenge: string;
  futureGoal: string;
  recentInspiration: string;
  howOthersSeeMe: string;
  personalityOneWord: string;
  coreValues: string;
  /** 価値観タグ（Step形式入力で追加。既存 coreValues とは併存） */
  valueTags?: ValueTag[];
};

export type PersonalityProfile = {
  type: PersonalityType;
  axes: PersonalityAxes;
  completedAt: string;
};

/** Trust Verification ステータス */
export type TrustVerificationStatus = 'pending' | 'reviewing' | 'verified' | 'rejected';

/** 本人確認の実施ソース */
export type VerificationSource = 'none' | 'id_only' | 'id_plus_public_info';

/**
 * Trust / 安全確認フィールド（将来 eKYC・AI顔認証・書類アップロード・外部API 連携を想定）
 * Date は ISO 8601 文字列で保持（DB/API 互換）
 */
export type MemberTrustVerificationFields = {
  trustVerificationStatus: TrustVerificationStatus;
  identityVerified: boolean;
  identityVerificationDate: string | null;
  trustVerificationDate: string | null;
  trustNotes: string | null;
  safetyFlags: string[];
  verificationSource: VerificationSource;
  /** 将来: eKYC / AI顔認証 / 外部API */
  identityVerificationMethod?: 'none' | 'manual_document' | 'ekyc' | 'ai_face_match' | 'external_api';
  externalVerificationRef?: string | null;
  documentUploadStatus?: 'none' | 'pending' | 'approved' | 'rejected';
};

/** 将来拡張: 自分 / 趣味 / 作品 / ペット / 景色 / イベント など */
export type ProfilePhotoCategory =
  | 'self'
  | 'hobby'
  | 'work'
  | 'pet'
  | 'scenery'
  | 'event'
  | null;

export type MemberProfilePhoto = {
  id: string;
  memberId: string;
  url: string;
  storagePath: string;
  sortOrder: number;
  category: ProfilePhotoCategory;
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
  /** プロフィール写真（最大6枚）。1枚目がメイン。 */
  photos: MemberProfilePhoto[];
  values: ProfileValues;
  purposes: ConnectionPurpose[];
  interestTags: InterestTag[];
  lifePhase: LifePhase;
  personality: PersonalityProfile | null;
  /** Hostバッジ（UIのみ・将来は実績ベースで自動付与） */
  hostBadges?: HostBadge[];
} & MemberTrustVerificationFields;

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
  /** 主催者がアップロードしたイベント写真（最大5枚）。空配列はカテゴリ既定表示にフォールバック。 */
  imageUrls?: string[];
  status: ConnectionEventStatus;
  isPast: boolean;
  confirmedMemberIds: string[];
  /** 参加費（円・税込）。0 または未設定は無料扱い */
  fee?: number;
  /** 承認方式。未設定は主催者承認制（host_approval）として扱う */
  approvalMode?: EventApprovalMode;
  /** 主催メンバーID（運営主催のシードイベントでは未設定） */
  hostId?: string;
  /** ユーザー作成イベントかどうか */
  isUserCreated?: boolean;
};

export type EventApplication = {
  id: string;
  eventId: string;
  memberId: string;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  /** 参加理由（100〜300文字） */
  reason?: string;
};

/** AI grouping 用の正規化スナップショット（将来の選定API向け） */
export type MemberGroupingProfile = {
  memberId: string;
  demographics: { age: number; gender: string; occupation: string; lifePhase: LifePhase };
  values: ProfileValues;
  purposes: ConnectionPurpose[];
  interestTags: InterestTag[];
  personality: PersonalityProfile | null;
  trust: Pick<
    MemberTrustVerificationFields,
    'trustVerificationStatus' | 'identityVerified' | 'verificationSource' | 'safetyFlags'
  >;
};
