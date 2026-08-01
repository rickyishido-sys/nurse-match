/** 自己紹介にSNS・連絡先を書かせない（非公開情報のため） */
const BIO_CONTACT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /@\w/u, label: '@ユーザー名' },
  { pattern: /https?:\/\//i, label: 'URL' },
  { pattern: /\bwww\./i, label: 'URL' },
  { pattern: /line\.me/i, label: 'LINE' },
  { pattern: /instagram/i, label: 'Instagram' },
  { pattern: /\binsta\b/i, label: 'Instagram' },
  { pattern: /tiktok/i, label: 'TikTok' },
  { pattern: /threads/i, label: 'Threads' },
  { pattern: /\bx\.com\b/i, label: 'X' },
  { pattern: /\btwitter\b/i, label: 'X' },
  { pattern: /facebook/i, label: 'Facebook' },
  { pattern: /\bline\b/i, label: 'LINE' },
  { pattern: /ライン/u, label: 'LINE' },
  { pattern: /インスタ/u, label: 'Instagram' },
];

export const BIO_CONTACT_REJECT_MESSAGE =
  'SNSや連絡先（@、URL、LINE、Instagram など）は自己紹介に記載できません。SNS情報はプロフィール編集の専用欄で非公開のまま登録できます。';

export function validateBioContactInfo(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const { pattern, label } of BIO_CONTACT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return `${BIO_CONTACT_REJECT_MESSAGE}（検出: ${label}）`;
    }
  }
  return null;
}
