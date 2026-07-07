export type ContactInquiryCategory =
  | 'service'
  | 'event'
  | 'account_deletion'
  | 'safety'
  | 'other';

export type ContactInquiryStatus = 'new' | 'resolved';

export const CONTACT_INQUIRY_CATEGORIES: { value: ContactInquiryCategory; label: string }[] = [
  { value: 'service', label: 'サービスについて' },
  { value: 'event', label: 'イベントについて' },
  { value: 'account_deletion', label: 'アカウント削除について' },
  { value: 'safety', label: '通報・安全に関する相談' },
  { value: 'other', label: 'その他' },
];

export const CONTACT_INQUIRY_CATEGORY_LABEL: Record<ContactInquiryCategory, string> = Object.fromEntries(
  CONTACT_INQUIRY_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ContactInquiryCategory, string>;

export const CONTACT_INQUIRY_STATUS_LABEL: Record<ContactInquiryStatus, string> = {
  new: '未対応',
  resolved: '対応済み',
};
