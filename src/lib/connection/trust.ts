import type {
  ConnectionMember,
  TrustVerificationStatus,
  VerificationSource,
} from '@/lib/connection/types';

/** 運営が付与する安全確認フラグ（管理画面用プリセット） */
export const SAFETY_FLAG_PRESETS = [
  'SNS確認済',
  '公開情報確認済',
  '追加確認必要',
  '本人確認書類確認済',
  '過去メディア掲載確認済',
] as const;

export const TRUST_STATUS_LABEL: Record<TrustVerificationStatus, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  verified: 'Verified',
  rejected: 'Rejected',
};

export const TRUST_STATUS_LABEL_JA: Record<TrustVerificationStatus, string> = {
  pending: '未確認',
  reviewing: '運営確認中',
  verified: 'Trust Verification済み',
  rejected: '確認不可',
};

export const VERIFICATION_SOURCE_LABEL: Record<VerificationSource, string> = {
  none: '未実施',
  id_only: '本人確認のみ',
  id_plus_public_info: '本人確認 + 公開情報',
};

/** 将来: eKYC / AI顔認証 / 外部API 連携用 */
export type IdentityVerificationMethod =
  | 'none'
  | 'manual_document'
  | 'ekyc'
  | 'ai_face_match'
  | 'external_api';

export type TrustVerificationExtension = {
  /** 本人確認の実施方法（将来拡張） */
  identityVerificationMethod?: IdentityVerificationMethod;
  /** 外部本人確認APIの参照ID */
  externalVerificationRef?: string | null;
  /** 書類アップロード状態（将来拡張） */
  documentUploadStatus?: 'none' | 'pending' | 'approved' | 'rejected';
};

export type PublicTrustBadge = {
  key: string;
  label: string;
  tone: 'verified' | 'identity' | 'reviewing' | 'muted';
};

/** 公開向けバッジ（プロフィール・参加者一覧） */
export function getPublicTrustBadges(member: ConnectionMember): PublicTrustBadge[] {
  const badges: PublicTrustBadge[] = [];

  if (member.identityVerified) {
    badges.push({ key: 'identity', label: '本人確認済み', tone: 'identity' });
  }

  if (member.trustVerificationStatus === 'verified') {
    badges.push({ key: 'trust', label: 'Trust Verification済み', tone: 'verified' });
  } else if (member.trustVerificationStatus === 'reviewing') {
    badges.push({ key: 'reviewing', label: '運営確認中', tone: 'reviewing' });
  }

  return badges;
}

export const TRUST_OPERATION_GUIDELINES = [
  '本人確認書類確認',
  '公開情報確認',
  'SNS確認',
  '過去メディア掲載情報確認',
] as const;

export const TRUST_OPERATION_NOTES = [
  'Google検索結果のみで機械的に判定しないこと',
  '最終判断は必ず運営者が行う',
] as const;
