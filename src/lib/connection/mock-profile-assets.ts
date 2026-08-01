/**
 * 固定サンプルアバター（顔写真バストアップのみ）
 * 管理: public/images/avatars/ — LP / モック / シードデータ共通
 * ランダム画像・Date.now() による URL 生成は使用しない。
 */
const avatar = (name: string) => `/images/avatars/${name}` as const;

/** 汎用フォールバック（写真未設定時のみ） */
export const FEMALE_PROFILE_SAMPLE = avatar('aoi.webp');
export const MALE_PROFILE_SAMPLE = avatar('ken.webp');

/** LP モック用キャラクター（主催者画面の Ken / Mio / Yui は必ず別画像） */
export const MOCK_PROFILES = {
  femaleAoi: avatar('aoi.webp'),
  femaleMio: avatar('mio.webp'),
  /** profile-sample.jpg 由来 — mio.webp と別人物 */
  femaleYui: avatar('yui.webp'),
  maleKen: avatar('ken.webp'),
  maleSho: avatar('sho.webp'),
} as const;

/** シードメンバー ID → 固定アバター（1ユーザー1画像） */
export const SEED_MEMBER_AVATARS: Record<string, string> = {
  m1: avatar('ayaka.webp'), // あやか
  m2: avatar('kenta.webp'), // 健太
  m3: avatar('mio.webp'), // 美咲
  m4: avatar('daisuke.png'), // 大輔
  m5: avatar('yui.webp'), // ゆい
  m6: avatar('sho.webp'), // 翔
  m7: avatar('risa.webp'), // 理沙
  m8: avatar('takuya.webp'), // 拓也
};

/** git HEAD `data.ts` の Unsplash ID → 固定ローカル画像 */
export const LEGACY_AVATAR_URL_MAP: Record<string, string> = {
  'photo-1494790108377-be9c29b29330': SEED_MEMBER_AVATARS.m1,
  'photo-1507003211169-0a1dd7228f2d': SEED_MEMBER_AVATARS.m2,
  'photo-1438761681033-6461ffad8d80': SEED_MEMBER_AVATARS.m3,
  'photo-1500648767791-00dcc994a43e': SEED_MEMBER_AVATARS.m4,
  'photo-1534528741775-53994a69daeb': SEED_MEMBER_AVATARS.m5,
  'photo-1506794778202-cad84cf45f1d': SEED_MEMBER_AVATARS.m6,
  'photo-1544005313-94ddf0286df2': SEED_MEMBER_AVATARS.m7,
  'photo-1472099645785-5658abf4ff4e': SEED_MEMBER_AVATARS.m8,
  'photo-1492562080023-ab3db9eb38fad': SEED_MEMBER_AVATARS.m8,
};

/** 旧 mock-profiles / profile-sample パス → 新 avatars へ */
const LEGACY_PATH_MAP: Record<string, string> = {
  '/images/profile-sample.webp': avatar('aoi.webp'),
  '/images/profile-sample-male.webp': avatar('ken.webp'),
  '/images/mock-profiles/mock-profile-female-1.png': avatar('ayaka.webp'),
  '/images/mock-profiles/mock-profile-female-2.png': avatar('mio.webp'),
  '/images/mock-profiles/mock-profile-female-3.webp': avatar('mio.webp'),
  '/images/mock-profiles/mock-profile-male-1.png': avatar('kenta.webp'),
  '/images/mock-profiles/mock-profile-male-2.png': avatar('daisuke.png'),
  '/images/mock-profiles/mock-profile-male.webp': avatar('kenta.webp'),
};

export function resolveFixedSampleAvatarUrl(
  rawUrl: string,
  gender?: 'female' | 'male' | 'other' | string | null,
): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    if (gender === 'male') return MALE_PROFILE_SAMPLE;
    if (gender === 'female') return FEMALE_PROFILE_SAMPLE;
    return '';
  }
  if (trimmed.startsWith('/images/avatars/')) return trimmed;
  if (LEGACY_PATH_MAP[trimmed]) return LEGACY_PATH_MAP[trimmed];
  if (trimmed.startsWith('/') || trimmed.startsWith('data:')) return trimmed;

  for (const [legacyId, fixedUrl] of Object.entries(LEGACY_AVATAR_URL_MAP)) {
    if (trimmed.includes(legacyId)) return fixedUrl;
  }

  if (/randomuser\.me|pravatar\.cc|i\.pravatar|picsum\.photos/i.test(trimmed)) {
    return gender === 'male' ? MALE_PROFILE_SAMPLE : FEMALE_PROFILE_SAMPLE;
  }

  return trimmed;
}
