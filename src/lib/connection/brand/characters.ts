/** WEDNESDAY — 9文字モチーフのブランドキャラクター定義（イラスト差し替え可能）
 * 表示 ON/OFF: src/lib/connection/brand/brand-config.ts の BRAND_CHARACTERS_ENABLED
 */
export type BrandCharacterId = 'W' | 'E1' | 'D1' | 'N' | 'E2' | 'S' | 'D2' | 'A' | 'Y';

export type BrandCharacter = {
  id: BrandCharacterId;
  letter: string;
  name: string;
  tagline: string;
  /** プレースホルダー用グラデーション */
  gradient: string;
  accent: string;
  /** 後から差し替えるイラストパス（未設定時はプレースホルダー表示） */
  imageSrc?: string;
};

export const BRAND_CHARACTERS: Record<BrandCharacterId, BrandCharacter> = {
  W: {
    id: 'W',
    letter: 'W',
    name: 'ワンダー',
    tagline: '歩くたび、出会いがひらく',
    gradient: 'from-[#2d6a5a] to-[#1f5d4f]',
    accent: '#3d8a74',
  },
  E1: {
    id: 'E1',
    letter: 'E',
    name: 'エコー',
    tagline: '声が重なり、笑いが生まれる',
    gradient: 'from-[#c9a86c] to-[#b8956a]',
    accent: '#d4b87a',
  },
  D1: {
    id: 'D1',
    letter: 'D',
    name: 'ドリーム',
    tagline: '想像を、体験に変える',
    gradient: 'from-[#7b5ea7] to-[#5c4080]',
    accent: '#9b7ec8',
  },
  N: {
    id: 'N',
    letter: 'N',
    name: 'ネスト',
    tagline: '心地よい場所をつくる',
    gradient: 'from-[#5a8f7b] to-[#3d6b55]',
    accent: '#7ab89a',
  },
  E2: {
    id: 'E2',
    letter: 'E',
    name: 'エンバー',
    tagline: 'あたたかさを灯す',
    gradient: 'from-[#c45c4a] to-[#9e3d32]',
    accent: '#e07a68',
  },
  S: {
    id: 'S',
    letter: 'S',
    name: 'スパーク',
    tagline: 'ひらめきが、つながりになる',
    gradient: 'from-[#4a90a4] to-[#2d6b7d]',
    accent: '#6bb0c4',
  },
  D2: {
    id: 'D2',
    letter: 'D',
    name: 'デュー',
    tagline: '朝露のように、新しい一日',
    gradient: 'from-[#8eb8c8] to-[#5a8fa8]',
    accent: '#a8d0e0',
  },
  A: {
    id: 'A',
    letter: 'A',
    name: 'オーラ',
    tagline: '香りと色で、記憶に残る',
    gradient: 'from-[#d4a0b8] to-[#b07090]',
    accent: '#e8b8cc',
  },
  Y: {
    id: 'Y',
    letter: 'Y',
    name: 'ヤーン',
    tagline: '物語の糸を、つなぐ',
    gradient: 'from-[#6b5b4a] to-[#4a3d32]',
    accent: '#9a8a78',
  },
};

export const CHARACTER_ORDER: BrandCharacterId[] = ['W', 'E1', 'D1', 'N', 'E2', 'S', 'D2', 'A', 'Y'];

/** ページごとのキャラクター配置マップ */
export const PAGE_CHARACTERS = {
  landingHero: ['W', 'E1', 'S'] as BrandCharacterId[],
  landingDefinition: ['D1', 'N'] as BrandCharacterId[],
  eventsList: ['E2', 'A'] as BrandCharacterId[],
  eventDetail: ['Y', 'D2'] as BrandCharacterId[],
  login: ['E1'] as BrandCharacterId[],
  register: ['W'] as BrandCharacterId[],
  notFound: ['S'] as BrandCharacterId[],
  empty: ['N'] as BrandCharacterId[],
  loading: ['D1'] as BrandCharacterId[],
  footer: CHARACTER_ORDER,
} as const;
