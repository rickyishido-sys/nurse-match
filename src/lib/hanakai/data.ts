import type {
  HanakaiEvent,
  HanakaiUser,
  InstructorStage,
  Live,
  Notice,
  Post,
  PostComment,
  SupportProject,
} from '@/lib/hanakai/types';

// Mock-backed data layer for the HANAKAI MVP.
// Real persistence (Supabase) is wired later; see supabase/hanakai-schema.sql.

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

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
  },
];

const events: HanakaiEvent[] = [
  {
    id: 'e1',
    title: '春の枝もの花会 ― 桜と語らう夜',
    startAt: '2026-06-20T18:30:00+09:00',
    area: '東京・世田谷',
    venue: 'アトリエ HANA 三軒茶屋',
    capacity: 12,
    reservedCount: 9,
    fee: 4500,
    description: '季節の枝ものを使って、自由に一杯いけます。終わったあとは参加者同士でゆっくり語らう時間も。',
    hostId: 'u1',
    hasAlcohol: true,
    coverUrl: img('photo-1490750967868-88aa4486c946'),
    status: 'almost_full',
    recommended: true,
  },
  {
    id: 'e2',
    title: '初心者歓迎 はじめての花会',
    startAt: '2026-06-22T14:00:00+09:00',
    area: '愛知・名古屋',
    venue: '名古屋コミュニティスペース栄',
    capacity: 16,
    reservedCount: 6,
    fee: 3000,
    description: '道具の使い方からていねいに。一人参加が9割なので安心してお越しください。',
    hostId: 'u1',
    hasAlcohol: false,
    coverUrl: img('photo-1463320726281-696a485928c7'),
    status: 'open',
    recommended: true,
  },
  {
    id: 'e3',
    title: '鎌倉・地域花会キックオフ',
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
    title: 'モダンアレンジ花会  in 大阪',
    startAt: '2026-07-05T17:00:00+09:00',
    area: '大阪・中央区',
    venue: 'OSAKA FLOWER LAB',
    capacity: 10,
    reservedCount: 4,
    fee: 5500,
    description: 'ドライと生花を組み合わせたモダンな表現を楽しむ会。作品はそのまま持ち帰れます。',
    hostId: 'u3',
    hasAlcohol: false,
    coverUrl: img('photo-1487070183336-b863922373d4'),
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
    title: '夢応援ライブ｜花屋を開きたいそらの挑戦',
    category: 'dream',
    hostId: 'u3',
    scheduledAt: '2026-06-19T21:30:00+09:00',
    isLiveNow: false,
    viewerCount: 0,
    cheerTotal: 7400,
    coverUrl: img('photo-1469259943454-aa100abba749'),
    description: '小さな花屋を開くまでの道のりを共有する応援配信です。',
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
    goalAmount: 300000,
    raisedAmount: 184000,
    supporterCount: 96,
    coverUrl: img('photo-1509719662282-d3e8a14d8d39'),
    payoutRate: 0.8,
  },
  {
    id: 's2',
    ownerId: 'u3',
    title: '小さな花屋を開きたい',
    category: 'shop',
    summary: 'モダンな花あわせを届ける、自分の店をはじめます。',
    story: '花会で背中を押されました。最初の什器と仕入れを整えるための応援を募集しています。',
    goalAmount: 500000,
    raisedAmount: 156000,
    supporterCount: 58,
    coverUrl: img('photo-1487070183336-b863922373d4'),
    payoutRate: 0.8,
  },
  {
    id: 's3',
    ownerId: 'u6',
    title: '認定講師になって札幌で教えたい',
    category: 'instructor',
    summary: '運営補助から講師へ。北海道で花会を広げます。',
    story: '講師試験と教材準備のための挑戦です。学んだことを地域に還元したい。',
    goalAmount: 200000,
    raisedAmount: 88000,
    supporterCount: 41,
    coverUrl: img('photo-1455659817273-f96807779a8a'),
    payoutRate: 0.8,
  },
];

const notices: Notice[] = [
  { id: 'n1', title: '花会28万人構想を公開しました', body: 'リアルとデジタルを循環させる花会の全体像を公開しました。', publishedAt: '2026-06-01T10:00:00+09:00' },
  { id: 'n2', title: '応援（投げ花）機能のベータ提供について', body: '夢や挑戦への共感で応援できる機能を順次提供します。', publishedAt: '2026-06-05T10:00:00+09:00' },
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
