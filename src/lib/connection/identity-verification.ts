import type { ConnectionMember } from '@/lib/connection/types';

/** 運営が「再提出依頼」を付与する際に使用する安全確認フラグ */
export const IDENTITY_RESUBMIT_FLAG = '再提出依頼' as const;

/** 本人確認の4状態（単一ソース） */
export type IdentityStatus = 'unsubmitted' | 'pending' | 'verified' | 'resubmission_required';

/** @deprecated Use IdentityStatus */
export type IdentityVerificationDisplayStatus = IdentityStatus;

export const IDENTITY_STATUS_LABEL: Record<IdentityStatus, string> = {
  unsubmitted: '本人確認書類が未提出です',
  pending: '本人確認書類を確認しています',
  verified: '本人確認済み',
  resubmission_required: '本人確認書類の再提出が必要です',
};

/** @deprecated Use IDENTITY_STATUS_LABEL */
export const IDENTITY_VERIFICATION_STATUS_LABEL = IDENTITY_STATUS_LABEL;

export const IDENTITY_STATUS_DESCRIPTION: Record<IdentityStatus, string> = {
  unsubmitted:
    '本人確認書類を提出すると、審査完了後に本人確認済みバッジが付与されます。',
  pending:
    '提出いただいた書類を確認しています。完了までしばらくお待ちください。',
  verified: '本人確認が完了しています。書類の更新が必要な場合は再提出できます。',
  resubmission_required:
    '書類の再提出が必要です。お手数ですが、本人確認書類を再度ご提出ください。',
};

/** @deprecated Use IDENTITY_STATUS_DESCRIPTION */
export const IDENTITY_VERIFICATION_STATUS_DESCRIPTION = IDENTITY_STATUS_DESCRIPTION;

export const IDENTITY_STATUS_TONE: Record<IdentityStatus, string> = {
  unsubmitted: 'text-[#c4c0b8]',
  pending: 'text-[#b8956a]',
  verified: 'text-[#1f5d4f]',
  resubmission_required: 'text-rose-600',
};

/** @deprecated Use IDENTITY_STATUS_TONE */
export const IDENTITY_VERIFICATION_STATUS_TONE = IDENTITY_STATUS_TONE;

export const IDENTITY_DOCUMENT_AUXILIARY_MESSAGE =
  'アップロードされた画像が、本人確認書類として読み取れる状態かを確認します。最終的な本人確認は運営による確認後に完了します。';

export function isIdentityResubmitRequested(member: ConnectionMember): boolean {
  return member.safetyFlags.includes(IDENTITY_RESUBMIT_FLAG);
}

/** 本人確認の4状態を判定（バッジ・ゲート・表示で共通利用） */
export function getIdentityStatus(member: ConnectionMember): IdentityStatus {
  if (member.identityVerified) return 'verified';
  if (isIdentityResubmitRequested(member)) return 'resubmission_required';
  if (
    member.documentUploadStatus === 'pending' ||
    member.trustVerificationStatus === 'reviewing'
  ) {
    return 'pending';
  }
  if (
    member.documentUploadStatus === 'rejected' ||
    member.trustVerificationStatus === 'rejected'
  ) {
    return 'resubmission_required';
  }
  return 'unsubmitted';
}

/** @deprecated Use getIdentityStatus */
export function getIdentityVerificationDisplayStatus(member: ConnectionMember): IdentityStatus {
  return getIdentityStatus(member);
}

export function getIdentitySubmitButtonLabel(status: IdentityStatus): 'submit' | 'update' | null {
  if (status === 'pending') return null;
  if (status === 'verified') return 'update';
  return 'submit';
}

export const IDENTITY_SUBMIT_BUTTON_LABEL = {
  submit: '本人確認書類を提出する',
  update: '本人確認書類を更新する',
} as const;
