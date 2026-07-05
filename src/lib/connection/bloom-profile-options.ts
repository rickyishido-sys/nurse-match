import type { Option } from '@/lib/connection/onboarding-options';

/** 年齢層（必須入力・AI推定しない） */
export type AgeBand =
  | '20s_early'
  | '20s_late'
  | '30s_early'
  | '30s_late'
  | '40s'
  | '50s'
  | '60s_plus';

export const AGE_BAND_OPTIONS: Option<AgeBand>[] = [
  { value: '20s_early', label: '20代前半（18〜24歳）' },
  { value: '20s_late', label: '20代後半（25〜29歳）' },
  { value: '30s_early', label: '30代前半（30〜34歳）' },
  { value: '30s_late', label: '30代後半（35〜39歳）' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s_plus', label: '60代以上' },
];

export const AGE_BAND_LABEL: Record<AgeBand, string> = Object.fromEntries(
  AGE_BAND_OPTIONS.map((o) => [o.value, o.label]),
) as Record<AgeBand, string>;

/** 既存 age カラムとの互換用（代表値） */
export const AGE_BAND_TO_AGE: Record<AgeBand, number> = {
  '20s_early': 22,
  '20s_late': 27,
  '30s_early': 32,
  '30s_late': 37,
  '40s': 42,
  '50s': 52,
  '60s_plus': 65,
};

export function inferAgeBandFromAge(age: number): AgeBand | '' {
  if (!age || age < 18) return '';
  if (age <= 24) return '20s_early';
  if (age <= 29) return '20s_late';
  if (age <= 34) return '30s_early';
  if (age <= 39) return '30s_late';
  if (age <= 49) return '40s';
  if (age <= 59) return '50s';
  return '60s_plus';
}

/** MBTI / 16タイプ */
export type MbtiType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP'
  | 'unknown';

export const MBTI_OPTIONS: Option<MbtiType>[] = [
  { value: 'INTJ', label: 'INTJ' },
  { value: 'INTP', label: 'INTP' },
  { value: 'ENTJ', label: 'ENTJ' },
  { value: 'ENTP', label: 'ENTP' },
  { value: 'INFJ', label: 'INFJ' },
  { value: 'INFP', label: 'INFP' },
  { value: 'ENFJ', label: 'ENFJ' },
  { value: 'ENFP', label: 'ENFP' },
  { value: 'ISTJ', label: 'ISTJ' },
  { value: 'ISFJ', label: 'ISFJ' },
  { value: 'ESTJ', label: 'ESTJ' },
  { value: 'ESFJ', label: 'ESFJ' },
  { value: 'ISTP', label: 'ISTP' },
  { value: 'ISFP', label: 'ISFP' },
  { value: 'ESTP', label: 'ESTP' },
  { value: 'ESFP', label: 'ESFP' },
  { value: 'unknown', label: 'わからない / あとで入力する' },
];

export const MBTI_LABEL: Record<MbtiType, string> = Object.fromEntries(
  MBTI_OPTIONS.map((o) => [o.value, o.label]),
) as Record<MbtiType, string>;

/** SNS プラットフォーム */
export type SocialLinkPlatform =
  | 'instagram'
  | 'x'
  | 'threads'
  | 'tiktok'
  | 'note'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'other';

export const SOCIAL_LINK_PLATFORMS: { platform: SocialLinkPlatform; label: string; placeholder: string }[] = [
  { platform: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { platform: 'x', label: 'X', placeholder: 'https://x.com/...' },
  { platform: 'threads', label: 'Threads', placeholder: 'https://threads.net/@...' },
  { platform: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { platform: 'note', label: 'note', placeholder: 'https://note.com/...' },
  { platform: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { platform: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { platform: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { platform: 'other', label: 'その他', placeholder: 'https://...' },
];

export const SOCIAL_PLATFORM_LABEL: Record<SocialLinkPlatform, string> = Object.fromEntries(
  SOCIAL_LINK_PLATFORMS.map((p) => [p.platform, p.label]),
) as Record<SocialLinkPlatform, string>;
