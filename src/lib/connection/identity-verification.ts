import type { ConnectionMember } from '@/lib/connection/types';

/** 運営が「再提出依頼」を付与する際に使用する安全確認フラグ */
export const IDENTITY_RESUBMIT_FLAG = '再提出依頼' as const;

/**
 * 本人確認の表示状態（単一ソース）
 * 未提出 → 送信中(client) → 確認中(pending) → 承認済み / 再提出
 */
export type IdentityStatus = 'unsubmitted' | 'pending' | 'verified' | 'resubmission_required';

/** @deprecated Use IdentityStatus */
export type IdentityVerificationDisplayStatus = IdentityStatus;

export const IDENTITY_STATUS_LABEL: Record<IdentityStatus, string> = {
  unsubmitted: '本人確認書類が未提出です',
  pending: '現在、運営が確認しています',
  verified: '本人確認済み',
  resubmission_required: '確認できなかったため、再提出をお願いします',
};

/** @deprecated Use IDENTITY_STATUS_LABEL */
export const IDENTITY_VERIFICATION_STATUS_LABEL = IDENTITY_STATUS_LABEL;

export const IDENTITY_STATUS_DESCRIPTION: Record<IdentityStatus, string> = {
  unsubmitted:
    '本人確認書類を提出すると、運営確認後に本人確認済みが表示されます。',
  pending:
    '本人確認書類を受け付けました。確認が完了すると、この画面に結果が表示されます。追加提出は不要です。',
  verified: '本人確認が完了しています。書類の更新が必要な場合は再提出できます。',
  resubmission_required:
    '書類の再提出が必要です。お手数ですが、本人確認書類を再度ご提出ください。',
};

/** @deprecated Use IDENTITY_STATUS_DESCRIPTION */
export const IDENTITY_VERIFICATION_STATUS_DESCRIPTION = IDENTITY_STATUS_DESCRIPTION;

export const IDENTITY_STATUS_TONE: Record<IdentityStatus, string> = {
  unsubmitted: 'text-[#8a8580]',
  pending: 'text-[#9a7340]',
  verified: 'text-[#1f5d4f]',
  resubmission_required: 'text-rose-700',
};

/** @deprecated Use IDENTITY_STATUS_TONE */
export const IDENTITY_VERIFICATION_STATUS_TONE = IDENTITY_STATUS_TONE;

export const IDENTITY_DOCUMENT_AUXILIARY_MESSAGE =
  'アップロードされた画像が、本人確認書類として読み取れる状態かを確認します。最終的な本人確認は運営による確認後に完了します。';

export const IDENTITY_SUBMITTING_COPY = {
  preparing: {
    title: '書類を準備しています',
    body: '画面を閉じずにお待ちください。',
  },
  uploading: {
    title: '本人確認書類を送信しています',
    body: '安全に保存しています。画面を閉じずにお待ちください。',
  },
  finalizing: {
    title: '提出内容を反映しています',
    body: '受付完了までもう少々お待ちください。',
  },
} as const;

/** @deprecated alias */
export const IDENTITY_SUBMITTING_MESSAGES = IDENTITY_SUBMITTING_COPY;

export function isIdentityResubmitRequested(member: ConnectionMember): boolean {
  return member.safetyFlags.includes(IDENTITY_RESUBMIT_FLAG);
}

/** 本人確認の4状態を判定（バッジ・ゲート・表示で共通利用） */
export function getIdentityStatus(member: ConnectionMember): IdentityStatus {
  if (member.identityVerified) return 'verified';
  if (isIdentityResubmitRequested(member)) return 'resubmission_required';
  if (
    member.documentUploadStatus === 'pending' ||
    member.trustVerificationStatus === 'reviewing' ||
    member.trustVerificationStatus === 'pending'
  ) {
    // pending document upload means under review; bare trust "pending" without
    // a document stays unsubmitted (checked via documentUploadStatus).
    if (
      member.documentUploadStatus === 'pending' ||
      member.trustVerificationStatus === 'reviewing'
    ) {
      return 'pending';
    }
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
