/** 利用規約・プライバシーポリシーの同意バージョン（各ページの改定日と同期） */
export const HANAKAI_TERMS_VERSION = '2026-07-16';
export const HANAKAI_PRIVACY_VERSION = '2026-07-08';

export type ConsentPlatform = 'ios' | 'android' | 'web';

export function hasRecordedLegalConsent(member: {
  termsAgreedAt?: string | null;
  privacyAgreedAt?: string | null;
  termsVersion?: string | null;
  privacyVersion?: string | null;
} | null | undefined): boolean {
  if (!member?.termsAgreedAt || !member?.privacyAgreedAt) return false;
  return member.termsVersion === HANAKAI_TERMS_VERSION && member.privacyVersion === HANAKAI_PRIVACY_VERSION;
}

/** User-Agent から同意記録用プラットフォームを推定 */
export function resolveConsentPlatform(userAgent: string | null | undefined): ConsentPlatform {
  const ua = userAgent ?? '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'web';
}

export function isValidConsentPlatform(value: string): value is ConsentPlatform {
  return value === 'ios' || value === 'android' || value === 'web';
}

export function isDevAuthBypassEnabled(): boolean {
  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') return false;
  return process.env.REGISTER_DEV_BYPASS_OTP === 'true' || process.env.HANAKAI_REGISTER_DEV_BYPASS === 'true';
}
