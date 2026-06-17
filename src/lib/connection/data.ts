import type {
  ConnectionEvent,
  ConnectionEventCategory,
  ConnectionMember,
  ConnectionMotivation,
  EventApplication,
} from '@/lib/connection/types';

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const MOTIVATION_LABEL: Record<ConnectionMotivation, string> = {
  new_friends: '新しい友人を作りたい',
  entrepreneurs: '経営者と繋がりたい',
  hobby: '趣味仲間が欲しい',
  community: '地域活動に興味がある',
  startup: '起業に興味がある',
  lonely: '最近孤独を感じる',
  more_connections: '人との繋がりを増やしたい',
};

export const MOTIVATION_OPTIONS = Object.entries(MOTIVATION_LABEL) as [ConnectionMotivation, string][];

export const EVENT_CATEGORY_LABEL: Record<ConnectionEventCategory, string> = {
  flower: 'Flower Connection',
  coffee: 'Coffee Connection',
  business: 'Business Connection',
  walking: 'Walking Connection',
  fitness: 'Fitness Connection',
};

export const EVENT_CATEGORY_ORDER: ConnectionEventCategory[] = [
  'flower',
  'coffee',
  'business',
  'walking',
  'fitness',
];

const members: ConnectionMember[] = [
  {
    id: 'm1',
    nickname: 'あやか',
    age: 32,
    gender: 'female',
    area: '東京・渋谷',
    occupation: 'ブランドマネージャー',
    bio: '仕事以外の出会いが少なくなってきたので、偶然のConnectionを楽しみたいです。',
    avatarUrl: img('photo-1494790108377-be9c29b29330', 200),
    motivations: ['new_friends', 'more_connections'],
  },
  {
    id: 'm2',
    nickname: '健太',
    age: 38,
    gender: 'male',
    area: '東京・目黒',
    occupation: 'スタートアップ経営',
    bio: '異業種の人とゆるく話せる場があれば。堅い交流会は苦手です。',
    avatarUrl: img('photo-1507003211169-0a1dd7228f2d', 200),
    motivations: ['entrepreneurs', 'startup', 'hobby'],
  },
  {
    id: 'm3',
    nickname: '美咲',
    age: 28,
    gender: 'female',
    area: '神奈川・横浜',
    occupation: 'UIデザイナー',
    bio: '最近転職して知り合いが減った。自然な形で人と繋がりたい。',
    avatarUrl: img('photo-1438761681033-6461ffad8d80', 200),
    motivations: ['new_friends', 'lonely', 'more_connections'],
  },
  {
    id: 'm4',
    nickname: '大輔',
    age: 45,
    gender: 'male',
    area: '東京・世田谷',
    occupation: 'コンサルタント',
    bio: '週末は散歩とコーヒーが好き。気軽に話せる仲間が欲しい。',
    avatarUrl: img('photo-1500648767791-00dcc994a43e', 200),
    motivations: ['hobby', 'community', 'new_friends'],
  },
  {
    id: 'm5',
    nickname: 'ゆい',
    age: 34,
    gender: 'female',
    area: '東京・表参道',
    occupation: 'フリーランスライター',
    bio: '在宅ワークが多く、リアルでの会話を大切にしたい。',
    avatarUrl: img('photo-1534528741775-53994a69daeb', 200),
    motivations: ['lonely', 'more_connections', 'hobby'],
  },
  {
    id: 'm6',
    nickname: '翔',
    age: 29,
    gender: 'male',
    area: '東京・中目黒',
    occupation: 'エンジニア',
    bio: 'マッチングアプリではなく、偶然から始まる出会いに興味があります。',
    avatarUrl: img('photo-1506794778202-cad84cf45f1d', 200),
    motivations: ['new_friends', 'startup'],
  },
  {
    id: 'm7',
    nickname: '理沙',
    age: 41,
    gender: 'female',
    area: '東京・恵比寿',
    occupation: '事業開発',
    bio: '経営者や挑戦する人との出会いを増やしたい。',
    avatarUrl: img('photo-1544005313-94ddf0286df2', 200),
    motivations: ['entrepreneurs', 'startup', 'community'],
  },
  {
    id: 'm8',
    nickname: '拓也',
    age: 36,
    gender: 'male',
    area: '神奈川・鎌倉',
    occupation: '地域商店経営',
    bio: '地域の活動にも関心があり、新しい視点の人と話したい。',
    avatarUrl: img('photo-1472099645785-5658abf4ff4e', 200),
    motivations: ['community', 'entrepreneurs', 'hobby'],
  },
];

const events: ConnectionEvent[] = [
  {
    id: 'ce1',
    title: 'Flower Connection — 表参道',
    category: 'flower',
    startAt: '2026-06-28T14:00:00+09:00',
    area: '東京・表参道',
    venue: 'PRIVATE SALON OMOTESANDO',
    capacity: 6,
    reservedCount: 4,
    hostName: 'HANAKAI Connection 運営',
    conditions: '20代〜40代・初参加歓迎・一人参加OK',
    description: '花をテーマにした、知らない6人のためのConnection Event。SNSでもマッチングアプリでもない、偶然と共感から始まる出会い。',
    coverUrl: img('photo-1490750967868-88aa4486c946'),
    status: 'open',
    isPast: false,
    confirmedMemberIds: [],
  },
  {
    id: 'ce2',
    title: 'Coffee Connection — 目黒',
    category: 'coffee',
    startAt: '2026-06-29T19:00:00+09:00',
    area: '東京・目黒',
    venue: 'CAFE CONNECTION Meguro',
    capacity: 6,
    reservedCount: 6,
    hostName: 'HANAKAI Connection 運営',
    conditions: '社会人・語学不問・カジュアルな服装で',
    description: 'コーヒーを片手に、知らない6人がゆっくり語る夜。テーマは自由。偶然の会話から、新しいConnectionが生まれます。',
    coverUrl: img('photo-1495474472287-4d71bcdd2085'),
    status: 'almost_full',
    isPast: false,
    confirmedMemberIds: [],
  },
  {
    id: 'ce3',
    title: 'Business Connection — 丸の内',
    category: 'business',
    startAt: '2026-07-05T18:30:00+09:00',
    area: '東京・丸の内',
    venue: 'MARUNOUCHI LOUNGE',
    capacity: 6,
    reservedCount: 3,
    hostName: 'HANAKAI Connection 運営',
    conditions: '事業・キャリアに関心がある方・名刺不要',
    description: '堅い交流会ではありません。仕事の話も、人生の話も。6人だけのプライベートなConnection。',
    coverUrl: img('photo-1517248135467-4c7edcad34c4'),
    status: 'open',
    isPast: false,
    confirmedMemberIds: [],
  },
  {
    id: 'ce4',
    title: 'Walking Connection — 代々木公園',
    category: 'walking',
    startAt: '2026-07-06T10:00:00+09:00',
    area: '東京・代々木',
    venue: '代々木公園 南参道エントランス',
    capacity: 6,
    reservedCount: 2,
    hostName: 'HANAKAI Connection 運営',
    conditions: '歩ける方・動きやすい服装・雨天中止',
    description: '歩きながら、知らない6人と自然に会話が生まれるConnection Event。',
    coverUrl: img('photo-1441974231530-c6227db76b6e'),
    status: 'open',
    isPast: false,
    confirmedMemberIds: [],
  },
  {
    id: 'ce5',
    title: 'Fitness Connection — 恵比寿',
    category: 'fitness',
    startAt: '2026-07-08T07:30:00+09:00',
    area: '東京・恵比寿',
    venue: 'STUDIO CONNECTION Ebisu',
    capacity: 6,
    reservedCount: 6,
    hostName: 'HANAKAI Connection 運営',
    conditions: '運動初心者歓迎・タオル持参',
    description: '軽いワークアウトのあと、6人で朝食Connection。体を動かしたあとの会話は、いつもと違う。',
    coverUrl: img('photo-1571019614242-c5c5dee9f50e'),
    status: 'full',
    isPast: false,
    confirmedMemberIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
  },
  {
    id: 'ce6',
    title: 'Coffee Connection — 横浜（終了）',
    category: 'coffee',
    startAt: '2026-06-08T19:00:00+09:00',
    area: '神奈川・横浜',
    venue: 'YOKOHAMA CONNECTION CAFE',
    capacity: 6,
    reservedCount: 6,
    hostName: 'HANAKAI Connection 運営',
    conditions: '社会人・初参加歓迎',
    description: '終了したイベント。参加者だけがConnectionページで繋がれます。',
    coverUrl: img('photo-1501339847302-ac426a4a7cbb'),
    status: 'completed',
    isPast: true,
    confirmedMemberIds: ['m1', 'm3', 'm5', 'm6', 'm7', 'm8'],
  },
];

let applications: EventApplication[] = [
  { id: 'a1', eventId: 'ce1', memberId: 'm1', appliedAt: '2026-06-10T10:00:00+09:00', status: 'pending' },
  { id: 'a2', eventId: 'ce1', memberId: 'm2', appliedAt: '2026-06-10T11:00:00+09:00', status: 'pending' },
  { id: 'a3', eventId: 'ce1', memberId: 'm3', appliedAt: '2026-06-11T09:00:00+09:00', status: 'pending' },
  { id: 'a4', eventId: 'ce1', memberId: 'm4', appliedAt: '2026-06-11T14:00:00+09:00', status: 'pending' },
  { id: 'a5', eventId: 'ce2', memberId: 'm5', appliedAt: '2026-06-09T10:00:00+09:00', status: 'pending' },
  { id: 'a6', eventId: 'ce2', memberId: 'm6', appliedAt: '2026-06-09T12:00:00+09:00', status: 'pending' },
  { id: 'a7', eventId: 'ce3', memberId: 'm7', appliedAt: '2026-06-12T10:00:00+09:00', status: 'pending' },
  { id: 'a8', eventId: 'ce3', memberId: 'm2', appliedAt: '2026-06-12T11:00:00+09:00', status: 'pending' },
  { id: 'a9', eventId: 'ce3', memberId: 'm8', appliedAt: '2026-06-13T09:00:00+09:00', status: 'pending' },
];

// --- accessors ---
export function listMembers() {
  return members;
}

export function getMember(id: string) {
  return members.find((m) => m.id === id) ?? null;
}

export function listEvents() {
  return [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function listUpcomingEvents(limit = 4) {
  return listEvents().filter((e) => !e.isPast).slice(0, limit);
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id) ?? null;
}

export function listApplications(eventId?: string) {
  const rows = eventId ? applications.filter((a) => a.eventId === eventId) : applications;
  return [...rows].sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
}

export function listPendingApplications(eventId: string) {
  return listApplications(eventId).filter((a) => a.status === 'pending');
}

export function getApplication(eventId: string, memberId: string) {
  return applications.find((a) => a.eventId === eventId && a.memberId === memberId) ?? null;
}

export function applyToEvent(eventId: string, memberId: string) {
  if (getApplication(eventId, memberId)) return;
  applications.push({
    id: `a${Date.now()}`,
    eventId,
    memberId,
    appliedAt: new Date().toISOString(),
    status: 'pending',
  });
  const event = getEvent(eventId);
  if (event) event.reservedCount = Math.min(event.capacity, event.reservedCount + 1);
}

export function confirmMemberForEvent(eventId: string, memberId: string) {
  const event = getEvent(eventId);
  if (!event) return;
  if (!event.confirmedMemberIds.includes(memberId)) {
    event.confirmedMemberIds.push(memberId);
  }
  const app = getApplication(eventId, memberId);
  if (app) app.status = 'confirmed';
}

export function removeMemberFromEvent(eventId: string, memberId: string) {
  const event = getEvent(eventId);
  if (!event) return;
  event.confirmedMemberIds = event.confirmedMemberIds.filter((id) => id !== memberId);
  const app = getApplication(eventId, memberId);
  if (app) app.status = 'pending';
}

export function getEventMembers(eventId: string) {
  const event = getEvent(eventId);
  if (!event) return [] as ConnectionMember[];
  return event.confirmedMemberIds.map((id) => getMember(id)).filter(Boolean) as ConnectionMember[];
}

export function canViewConnectionPage(eventId: string, viewerMemberId: string) {
  const event = getEvent(eventId);
  if (!event?.isPast) return false;
  return event.confirmedMemberIds.includes(viewerMemberId);
}

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
