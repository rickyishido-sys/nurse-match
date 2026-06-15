import type {
  EventCategory,
  HanakaiEvent,
  HanakaiUser,
  InstructorStage,
  Live,
  LiveCategory,
  Notice,
  Post,
  PostComment,
  SupportCategory,
  SupportProject,
} from '@/lib/hanakai/types';

// Mock-backed data layer for the HANAKAI MVP.
// Real persistence (Supabase) is wired later; see supabase/hanakai-schema.sql.

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// --- 「リアル → デジタル → リアル」の循環 ---
export const CYCLE_STEPS = [
  {
    key: 'real-in',
    phase: 'リアル',
    icon: '🌿',
    title: 'リアル花会で花をいける',
    body: '同じ場所で花に向き合い、自然と会話が生まれる。体験を一緒につくる時間。',
  },
  {
    key: 'digital',
    phase: 'デジタル',
    icon: '📱',
    title: 'アプリで投稿・人を知る・応援する',
    body: '作品や想いを投稿し、人柄を知る。気になる人をフォローし、挑戦を応援する。',
  },
  {
    key: 'real-out',
    phase: 'リアル',
    icon: '🤝',
    title: 'またリアル花会で会う',
    body: '価値観の合う人と、また花会で会う。巡るほど関係はゆっくり深まっていく。',
  },
] as const;

// --- 花会28万人構想の数字根拠 ---
export const VISION_MATH = {
  perBaseMonthly: 4, // 1拠点 月4回
  perEvent: 6, // 1回6名
  perBaseYearly: 288, // 年間288名 (4回 x 12ヶ月 x 6名)
  bases: 1000, // 1000拠点
  total: 288000, // 年間 288,000名
} as const;

// --- 花会コイン（HANAKAI Coin）。決済は未実装のモック ---
// コインは「応援の手段」、花は「応援の演出」。
export type CoinPackage = {
  coins: number;
  price: number; // 円（1コイン = 1円）
};

export const COIN_PACKAGES: CoinPackage[] = [
  { coins: 100, price: 100 },
  { coins: 500, price: 500 },
  { coins: 1000, price: 1000 },
  { coins: 3000, price: 3000 },
  { coins: 10000, price: 10000 },
];

// --- 応援メニュー（コイン → 花の演出） ---
export type CheerTier = {
  id: string;
  coins: number;
  label: string; // 演出名
  emoji: string; // 代表アイコン
  effect: string; // 演出の説明
  burst: string[]; // 画面に咲く花の演出
  size: 'sm' | 'md' | 'lg' | 'xl';
};

export const CHEER_TIERS: CheerTier[] = [
  { id: 'cheer-100', coins: 100, label: '一輪', emoji: '🌷', effect: '一輪の花が咲く', burst: ['🌷'], size: 'sm' },
  { id: 'cheer-500', coins: 500, label: '一輪のばら', emoji: '🌹', effect: 'ばらが咲く', burst: ['🌹', '🌹'], size: 'sm' },
  { id: 'cheer-1000', coins: 1000, label: '花束', emoji: '💐', effect: '花束が咲く', burst: ['💐', '🌷', '🌹'], size: 'md' },
  { id: 'cheer-3000', coins: 3000, label: '大きな花束', emoji: '💐', effect: '花束アニメーション', burst: ['💐', '💐', '🌹', '🌷', '🌸'], size: 'lg' },
  { id: 'cheer-10000', coins: 10000, label: '巨大な花束', emoji: '🏵️', effect: '巨大な花束演出', burst: ['🏵️', '💐', '🌹', '🌷', '🌸', '💐', '🌹', '🌷', '🌸'], size: 'xl' },
];

// --- 保有コイン・応援履歴（ビューア向けモック） ---
export type CoinWallet = {
  balance: number;
  totalCheered: number; // 応援に使った総コイン
  cheerCount: number; // 応援回数
};

const MOCK_WALLET: CoinWallet = {
  balance: 12500,
  totalCheered: 52300,
  cheerCount: 37,
};

export function getWallet(): CoinWallet {
  return MOCK_WALLET;
}

// --- ライブの応援フィード（モック） ---
export type CheerEvent = {
  id: string;
  userName: string;
  coins: number;
  emoji: string;
};

export function listLiveCheerFeed(): CheerEvent[] {
  return [
    { id: 'cf1', userName: '山田 花子', coins: 500, emoji: '🌹' },
    { id: 'cf2', userName: '蓮', coins: 1000, emoji: '💐' },
    { id: 'cf3', userName: '楓', coins: 100, emoji: '🌷' },
    { id: 'cf4', userName: '拓海', coins: 3000, emoji: '💐' },
  ];
}

export function formatCoin(value: number) {
  return `${value.toLocaleString('ja-JP')} Coin`;
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  day: '昼の花会',
  night: '夜の花会',
  alcohol: 'お酒あり花会',
  business: '経営者花会',
  parent_child: '親子花会',
  senior: 'シニア花会',
  area_launch: '地域立ち上げ花会',
};

export const EVENT_CATEGORY_ORDER: EventCategory[] = [
  'day',
  'night',
  'alcohol',
  'business',
  'parent_child',
  'senior',
  'area_launch',
];

export const SUPPORT_CATEGORY_LABEL: Record<SupportCategory, string> = {
  instructor: '花会講師になりたい',
  area: '地域花会を立ち上げたい',
  shop: '花屋を開きたい',
  learn: '花を学びたい',
  spread: '親子・地域に花会を広げたい',
};

export const LIVE_CATEGORY_LABEL: Record<LiveCategory, string> = {
  hanakai: '花会ライブ',
  challenge: '講師チャレンジ',
  area_launch: '地域立ち上げ',
  shop: '花屋開業',
  study: '花留学',
  report: '開催レポート',
  dream: '夢応援',
};

export const INSTRUCTOR_STAGE_LABEL: Record<InstructorStage, string> = {
  participant: '参加者',
  regular: '常連',
  support: '運営補助',
  candidate: '講師候補',
  certified: '認定講師',
  area_lead: 'エリア責任者',
};

export const INSTRUCTOR_STAGE_ORDER: InstructorStage[] = [
  'participant',
  'regular',
  'support',
  'candidate',
  'certified',
  'area_lead',
];

const users: HanakaiUser[] = [
  {
    id: 'u1',
    handle: 'mai_flower',
    nickname: '麻衣',
    age: 32,
    gender: 'female',
    area: '東京・世田谷',
    bio: '週末は花と向き合う時間が好きです。花会で出会えた人たちと、また会えるのが嬉しい。',
    interestTags: ['いけばな', 'ナチュラル', '季節の枝もの'],
    purpose: '同じ感性の人とゆるくつながりたい',
    avatarUrl: img('photo-1494790108377-be9c29b29330', 200),
    instructorStage: 'certified',
    joinedEventCount: 42,
    postCount: 38,
    followerCount: 1280,
    cheerPoints: 8600,
    isCertified: true,
    supportedCoins: 52300,
    supportCount: 37,
  },
  {
    id: 'u2',
    handle: 'ren_atelier',
    nickname: '蓮',
    age: 38,
    gender: 'male',
    area: '神奈川・鎌倉',
    bio: '地域で小さな花会を立ち上げようとしています。花を通じた居場所づくりが目標。',
    interestTags: ['地域コミュニティ', '枝もの', '器'],
    purpose: '地域花会を立ち上げたい',
    avatarUrl: img('photo-1507003211169-0a1dd7228f2d', 200),
    instructorStage: 'candidate',
    joinedEventCount: 28,
    postCount: 21,
    followerCount: 540,
    cheerPoints: 5200,
    isCertified: false,
    supportedCoins: 18400,
    supportCount: 21,
  },
  {
    id: 'u3',
    handle: 'sora_design',
    nickname: 'そら',
    age: 26,
    gender: 'other',
    area: '大阪・中央区',
    bio: 'モダンな花あわせが得意。いつか自分の花屋を持ちたい。',
    interestTags: ['モダン', 'ドライフラワー', '花屋開業'],
    purpose: '花屋を開きたい',
    avatarUrl: img('photo-1438761681033-6461ffad8d80', 200),
    instructorStage: 'regular',
    joinedEventCount: 12,
    postCount: 15,
    followerCount: 320,
    cheerPoints: 2400,
    isCertified: false,
    supportedCoins: 7600,
    supportCount: 12,
  },
  {
    id: 'u4',
    handle: 'kaede_h',
    nickname: '楓',
    age: 45,
    gender: 'female',
    area: '愛知・名古屋',
    bio: '初心者です。花を学びながら、優しい人たちと出会えたら。',
    interestTags: ['初心者', '和の花', '癒やし'],
    purpose: '花を学びたい',
    avatarUrl: img('photo-1534528741775-53994a69daeb', 200),
    instructorStage: 'participant',
    joinedEventCount: 3,
    postCount: 2,
    followerCount: 48,
    cheerPoints: 120,
    isCertified: false,
    supportedCoins: 1500,
    supportCount: 4,
  },
  {
    id: 'u5',
    handle: 'taku_area',
    nickname: '拓海',
    age: 41,
    gender: 'male',
    area: '福岡・天神',
    bio: '九州エリアの花会を束ねています。挑戦する人を応援したい。',
    interestTags: ['運営', '応援', 'エリア'],
    purpose: '花会を広げたい',
    avatarUrl: img('photo-1500648767791-00dcc994a43e', 200),
    instructorStage: 'area_lead',
    joinedEventCount: 96,
    postCount: 54,
    followerCount: 3100,
    cheerPoints: 21000,
    isCertified: true,
    supportedCoins: 138000,
    supportCount: 92,
  },
  {
    id: 'u6',
    handle: 'nao_support',
    nickname: '奈緒',
    age: 30,
    gender: 'female',
    area: '北海道・札幌',
    bio: '運営のお手伝いをしながら、講師を目指しています。',
    interestTags: ['運営補助', 'ワイルドフラワー', '撮影'],
    purpose: '講師になりたい',
    avatarUrl: img('photo-1544005313-94ddf0286df2', 200),
    instructorStage: 'support',
    joinedEventCount: 19,
    postCount: 27,
    followerCount: 410,
    cheerPoints: 3300,
    isCertified: false,
    supportedCoins: 9800,
    supportCount: 15,
  },
];

const events: HanakaiEvent[] = [
  {
    id: 'e1',
    title: '春の枝もの花会 ― 桜と語らう夜',
    category: 'alcohol',
    startAt: '2026-06-20T18:30:00+09:00',
    area: '東京・世田谷',
    venue: 'アトリエ HANA 三軒茶屋',
    capacity: 12,
    reservedCount: 9,
    fee: 4500,
    description: '季節の枝ものを使って、自由に一杯いけます。いけ終わったあとは、お酒を片手に参加者同士でゆっくり語らう時間も。',
    hostId: 'u1',
    hasAlcohol: true,
    coverUrl: img('photo-1490750967868-88aa4486c946'),
    status: 'almost_full',
    recommended: true,
  },
  {
    id: 'e2',
    title: '昼の花会 ― はじめての一杯',
    category: 'day',
    startAt: '2026-06-22T14:00:00+09:00',
    area: '愛知・名古屋',
    venue: '名古屋コミュニティスペース栄',
    capacity: 16,
    reservedCount: 6,
    fee: 3000,
    description: '道具の使い方からていねいに。一人参加が9割なので、はじめてでも安心して体験を共有できます。',
    hostId: 'u1',
    hasAlcohol: false,
    coverUrl: img('photo-1463320726281-696a485928c7'),
    status: 'open',
    recommended: true,
  },
  {
    id: 'e3',
    title: '鎌倉・地域花会キックオフ',
    category: 'area_launch',
    startAt: '2026-06-28T13:00:00+09:00',
    area: '神奈川・鎌倉',
    venue: '鎌倉 古民家サロン',
    capacity: 20,
    reservedCount: 20,
    fee: 5000,
    description: '地域で花会を続けていくための立ち上げ会。一緒に育ててくれる仲間を募集します。',
    hostId: 'u2',
    hasAlcohol: true,
    coverUrl: img('photo-1509719662282-d3e8a14d8d39'),
    status: 'full',
    recommended: false,
  },
  {
    id: 'e4',
    title: '夜の花会 ― モダンアレンジ in 大阪',
    category: 'night',
    startAt: '2026-07-05T19:00:00+09:00',
    area: '大阪・中央区',
    venue: 'OSAKA FLOWER LAB',
    capacity: 10,
    reservedCount: 4,
    fee: 5500,
    description: '仕事帰りに立ち寄れる夜の会。ドライと生花を組み合わせたモダンな表現を楽しみ、作品はそのまま持ち帰れます。',
    hostId: 'u3',
    hasAlcohol: false,
    coverUrl: img('photo-1487070183336-b863922373d4'),
    status: 'open',
    recommended: true,
  },
  {
    id: 'e5',
    title: '経営者花会 ― 花と対話の時間',
    category: 'business',
    startAt: '2026-07-08T18:30:00+09:00',
    area: '東京・丸の内',
    venue: 'MARUNOUCHI SALON',
    capacity: 12,
    reservedCount: 7,
    fee: 8000,
    description: '経営者・事業づくりに挑む人が集う花会。花をいけながら、立場を超えて率直に語り合える場です。',
    hostId: 'u5',
    hasAlcohol: true,
    coverUrl: img('photo-1519681393784-d120267933ba'),
    status: 'open',
    recommended: true,
  },
  {
    id: 'e6',
    title: '親子花会 ― いっしょに花あそび',
    category: 'parent_child',
    startAt: '2026-07-12T10:30:00+09:00',
    area: '神奈川・横浜',
    venue: 'みなとみらいキッズスタジオ',
    capacity: 14,
    reservedCount: 11,
    fee: 3500,
    description: '親子で参加できる花会。小さな子も触れる安全な花材を用意。一緒に手を動かす体験が思い出になります。',
    hostId: 'u4',
    hasAlcohol: false,
    coverUrl: img('photo-1471696035578-3d8c78d99684'),
    status: 'almost_full',
    recommended: false,
  },
  {
    id: 'e7',
    title: 'シニア花会 ― ゆっくり季節をいける',
    category: 'senior',
    startAt: '2026-07-15T13:30:00+09:00',
    area: '京都・中京区',
    venue: '町家サロン 椿',
    capacity: 10,
    reservedCount: 5,
    fee: 3000,
    description: 'ゆっくりとした進行で、季節の花を楽しむ会。長く花に親しんできた方も、これからの方も歓迎です。',
    hostId: 'u1',
    hasAlcohol: false,
    coverUrl: img('photo-1502920917128-1aa500764cbd'),
    status: 'open',
    recommended: false,
  },
  {
    id: 'e8',
    title: '札幌・地域花会立ち上げ会',
    category: 'area_launch',
    startAt: '2026-07-20T13:00:00+09:00',
    area: '北海道・札幌',
    venue: '札幌 コミュニティラボ',
    capacity: 18,
    reservedCount: 9,
    fee: 4000,
    description: '北海道で花会を根づかせるための立ち上げ会。運営に関わってみたい人、地域に居場所をつくりたい人を募集します。',
    hostId: 'u6',
    hasAlcohol: false,
    coverUrl: img('photo-1508808787358-d4f1e2f8e6c9'),
    status: 'open',
    recommended: true,
  },
];

const posts: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    imageUrl: img('photo-1518895949257-7621c3c786d7'),
    title: '桜の枝とスイートピー',
    body: '春の花会で。枝のラインを生かして、余白を大切にいけました。',
    flowersUsed: ['桜', 'スイートピー', 'ユーカリ'],
    eventId: 'e1',
    tags: ['ナチュラル', '枝もの'],
    likeCount: 184,
    createdAt: '2026-06-08T20:10:00+09:00',
  },
  {
    id: 'p2',
    authorId: 'u3',
    imageUrl: img('photo-1496062031456-07b8f162a322'),
    title: 'ドライと生花のあわせ',
    body: 'モダン花会の練習作。質感の違いを楽しんでもらえたら。',
    flowersUsed: ['プロテア', 'パンパスグラス', 'バラ'],
    eventId: 'e4',
    tags: ['モダン', 'ドライフラワー'],
    likeCount: 96,
    createdAt: '2026-06-09T12:30:00+09:00',
  },
  {
    id: 'p3',
    authorId: 'u6',
    imageUrl: img('photo-1455659817273-f96807779a8a'),
    title: 'はじめてのワイルドフラワー',
    body: '運営のお手伝いをしながら自分でもいけてみました。撮影も楽しい。',
    flowersUsed: ['ワイルドフラワー', 'かすみ草'],
    eventId: null,
    tags: ['初心者', 'ワイルド'],
    likeCount: 51,
    createdAt: '2026-06-10T09:05:00+09:00',
  },
  {
    id: 'p4',
    authorId: 'u4',
    imageUrl: img('photo-1462530260150-162092dad1a8'),
    title: '和の花に挑戦',
    body: 'はじめての花会で教わった和のいけ方。次も参加したいです。',
    flowersUsed: ['菊', '南天'],
    eventId: 'e2',
    tags: ['和', '初心者'],
    likeCount: 33,
    createdAt: '2026-06-10T18:40:00+09:00',
  },
];

const comments: PostComment[] = [
  { id: 'c1', postId: 'p1', authorId: 'u2', body: '余白の取り方が素敵です。次の花会で直接お話したいです。', createdAt: '2026-06-08T21:00:00+09:00' },
  { id: 'c2', postId: 'p1', authorId: 'u4', body: '初心者ですが憧れます…！', createdAt: '2026-06-08T22:15:00+09:00' },
  { id: 'c3', postId: 'p2', authorId: 'u1', body: '質感の対比がいいですね。', createdAt: '2026-06-09T13:00:00+09:00' },
];

const lives: Live[] = [
  {
    id: 'l1',
    title: '認定講師チャレンジ｜麻衣の枝もの実演',
    category: 'challenge',
    hostId: 'u1',
    scheduledAt: '2026-06-15T21:00:00+09:00',
    isLiveNow: true,
    viewerCount: 312,
    cheerTotal: 48000,
    coverUrl: img('photo-1471696035578-3d8c78d99684'),
    description: '認定講師を目指すチャレンジ配信。実演しながら質問にも答えます。',
  },
  {
    id: 'l2',
    title: '鎌倉に花会をつくりたい｜立ち上げライブ',
    category: 'area_launch',
    hostId: 'u2',
    scheduledAt: '2026-06-18T20:00:00+09:00',
    isLiveNow: false,
    viewerCount: 0,
    cheerTotal: 12000,
    coverUrl: img('photo-1502780402662-acc01917738e'),
    description: '地域で花会を続けるための想いを話します。応援よろしくお願いします。',
  },
  {
    id: 'l3',
    title: '花屋開業ライブ｜小さな花屋を開きたいそらの挑戦',
    category: 'shop',
    hostId: 'u3',
    scheduledAt: '2026-06-19T21:30:00+09:00',
    isLiveNow: false,
    viewerCount: 0,
    cheerTotal: 7400,
    coverUrl: img('photo-1469259943454-aa100abba749'),
    description: '小さな花屋を開くまでの道のりを共有する応援配信。物件・仕入れ・想いを正直に話します。',
  },
  {
    id: 'l4',
    title: 'ドイツ花留学ライブ｜本場で学んでくる',
    category: 'study',
    hostId: 'u6',
    scheduledAt: '2026-06-25T21:00:00+09:00',
    isLiveNow: false,
    viewerCount: 0,
    cheerTotal: 15800,
    coverUrl: img('photo-1465495976277-4387d4b0b4c6'),
    description: 'ドイツでフラワーデザインを学ぶ挑戦。学んだことは必ず花会に持ち帰り、みんなに還元します。',
  },
  {
    id: 'l5',
    title: '花会開催レポートライブ｜九州エリアのいま',
    category: 'report',
    hostId: 'u5',
    scheduledAt: '2026-06-16T20:30:00+09:00',
    isLiveNow: false,
    viewerCount: 0,
    cheerTotal: 9200,
    coverUrl: img('photo-1444930694458-01babf71870c'),
    description: '各地の花会がどんな様子だったかを共有するレポート配信。次に会いたい人が見つかるかも。',
  },
];

const supportProjects: SupportProject[] = [
  {
    id: 's1',
    ownerId: 'u2',
    title: '鎌倉で月1の地域花会を続けたい',
    category: 'area',
    summary: '花を通じた地域の居場所を、続けられる形にしたい。',
    story:
      '一度きりのイベントではなく、毎月通える場所をつくりたい。会場費と花材を安定して用意できれば、参加費を抑えて誰でも来られる花会にできます。',
    goalCoins: 300000,
    raisedCoins: 184000,
    supporterCount: 96,
    coverUrl: img('photo-1509719662282-d3e8a14d8d39'),
  },
  {
    id: 's2',
    ownerId: 'u3',
    title: '小さな花屋を開きたい',
    category: 'shop',
    summary: 'モダンな花あわせを届ける、自分の店をはじめます。',
    story: '花会で背中を押されました。最初の什器と仕入れを整えるための応援を募集しています。',
    goalCoins: 500000,
    raisedCoins: 156000,
    supporterCount: 58,
    coverUrl: img('photo-1487070183336-b863922373d4'),
  },
  {
    id: 's3',
    ownerId: 'u6',
    title: '認定講師になって札幌で教えたい',
    category: 'instructor',
    summary: '運営補助から講師へ。北海道で花会を広げます。',
    story: '講師試験と教材準備のための挑戦です。学んだことを地域に還元したい。',
    goalCoins: 200000,
    raisedCoins: 88000,
    supporterCount: 41,
    coverUrl: img('photo-1455659817273-f96807779a8a'),
  },
  {
    id: 's4',
    ownerId: 'u6',
    title: 'ドイツ花留学チャレンジ',
    category: 'learn',
    summary: '本場ドイツでフラワーデザインを学び、花会に還元する。',
    story: 'ドイツの花文化を現地で学び、その技術と考え方を日本の花会に持ち帰ります。学んだことはライブとレポートで全部共有します。',
    goalCoins: 500000,
    raisedCoins: 238000,
    supporterCount: 127,
    coverUrl: img('photo-1465495976277-4387d4b0b4c6'),
  },
];

const notices: Notice[] = [
  { id: 'n1', title: '花会28万人構想を公開しました', body: 'リアルとデジタルを循環させる花会の全体像を公開しました。', publishedAt: '2026-06-01T10:00:00+09:00' },
  { id: 'n2', title: '花会コインによる応援機能のベータ提供について', body: '花会コインで夢や挑戦を応援し、画面に花を咲かせる応援経済圏を順次提供します。', publishedAt: '2026-06-05T10:00:00+09:00' },
];

// --- accessors ---
export function listUsers() {
  return users;
}
export function getUser(id: string) {
  return users.find((u) => u.id === id) ?? null;
}
export function getUserName(id: string) {
  return getUser(id)?.nickname ?? '名称未設定';
}
export function listRecommendedUsers(limit = 4) {
  return [...users].sort((a, b) => b.cheerPoints - a.cheerPoints).slice(0, limit);
}

export function listEvents() {
  return [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
export function getEvent(id: string) {
  return events.find((e) => e.id === id) ?? null;
}
export function listUpcomingEvents(limit = 3) {
  return listEvents().slice(0, limit);
}
export function listRecommendedEvents(limit = 3) {
  return listEvents().filter((e) => e.recommended).slice(0, limit);
}
export function listEventParticipants(eventId: string) {
  // Mock: derive a stable subset of users as participants.
  const event = getEvent(eventId);
  if (!event) return [] as HanakaiUser[];
  return users.filter((_, idx) => idx < Math.min(event.reservedCount, users.length));
}

export function listPosts() {
  return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getPost(id: string) {
  return posts.find((p) => p.id === id) ?? null;
}
export function listPostsByAuthor(authorId: string) {
  return listPosts().filter((p) => p.authorId === authorId);
}
export function listLatestPosts(limit = 4) {
  return listPosts().slice(0, limit);
}
export function listComments(postId: string) {
  return comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listLives() {
  return [...lives].sort((a, b) => Number(b.isLiveNow) - Number(a.isLiveNow));
}
export function getLive(id: string) {
  return lives.find((l) => l.id === id) ?? null;
}
export function listFeaturedLives(limit = 3) {
  return listLives().slice(0, limit);
}

export function listSupportProjects() {
  return supportProjects;
}
export function getSupportProject(id: string) {
  return supportProjects.find((s) => s.id === id) ?? null;
}
export function listFeaturedSupport(limit = 3) {
  return [...supportProjects].sort((a, b) => b.supporterCount - a.supporterCount).slice(0, limit);
}

export function listNotices() {
  return [...notices].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function listInstructorCandidates() {
  return users.filter((u) => u.instructorStage === 'candidate' || u.instructorStage === 'support');
}
export function listCertifiedInstructors() {
  return users.filter((u) => u.isCertified);
}

// --- formatting helpers ---
export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
export function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`;
}
