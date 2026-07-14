import type { ConnectionMember } from '@/lib/connection/types';

/** 運営が「再提出依頼」を付与する際に使用する安全確認フラグ */
export const IDENTITY_RESUBMIT_FLAG = '再提出依頼' as const;

export type IdentityVerificationDisplayStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'resubmit_required';

export const IDENTITY_VERIFICATION_STATUS_LABEL: Record<IdentityVerificationDisplayStatus, string> = {
  not_submitted: '未提出',
  pending: '確認中',
  verified: '認証済み',
  resubmit_required: '再提出が必要',
};

export const IDENTITY_VERIFICATION_STATUS_DESCRIPTION: Record<
  IdentityVerificationDisplayStatus,
  string
> = {
  not_submitted:
    '本人確認書類を提出すると、審査完了後に本人確認済みバッジが付与されます。',
  pending: '提出いただいた書類を確認しています。完了までしばらくお待ちください。',
  verified: '本人確認が完了しています。書類の更新が必要な場合は再提出できます。',
  resubmit_required:
    '書類の再提出が必要です。お手数ですが、本人確認書類を再度ご提出ください。',
};

export const IDENTITY_VERIFICATION_STATUS_TONE: Record<IdentityVerificationDisplayStatus, string> = {
  not_submitted: 'text-[#c4c0b8]',
  pending: 'text-[#b8956a]',
  verified: 'text-[#1f5d4f]',
  resubmit_required: 'text-rose-600',
};

export function isIdentityResubmitRequested(member: ConnectionMember): boolean {
  return member.safetyFlags.includes(IDENTITY_RESUBMIT_FLAG);
}

export function getIdentityVerificationDisplayStatus(
  member: ConnectionMember,
): IdentityVerificationDisplayStatus {
  if (isIdentityResubmitRequested(member)) return 'resubmit_required';
  if (member.identityVerified || member.documentUploadStatus === 'approved') return 'verified';
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
    return 'resubmit_required';
  }
  return 'not_submitted';
}

export function getIdentitySubmitButtonLabel(
  status: IdentityVerificationDisplayStatus,
): 'submit' | 'update' | null {
  if (status === 'pending') return null;
  if (status === 'verified') return 'update';
  return 'submit';
}

export const IDENTITY_SUBMIT_BUTTON_LABEL = {
  submit: '本人確認書類を提出する',
  update: '本人確認書類を更新する',
} as const;
