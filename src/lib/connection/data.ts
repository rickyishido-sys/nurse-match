import type {
  ConnectionEvent,
  ConnectionEventCategory,
  ConnectionMember,
  ConnectionPurpose,
  EventApplication,
  InterestTag,
  LifePhase,
  MemberGroupingProfile,
  MemberTrustVerificationFields,
  PersonalityProfile,
  ProfileValues,
  TrustVerificationStatus,
  ValueTag,
  VerificationSource,
} from '@/lib/connection/types';

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PURPOSE_LABEL: Record<ConnectionPurpose, string> = {
  new_friends: '新しい友人が欲しい',
  hobby_buddies: '趣味仲間が欲しい',
  life_stimulus: '人生の刺激が欲しい',
  learning: '学びを得たい',
  mutual_support: '応援し合える仲間が欲しい',
  cross_industry: '異業種の人と話したい',
  local_community: '地域で繋がりたい',
  other: 'その他',
};

export const PURPOSE_OPTIONS = Object.entries(PURPOSE_LABEL) as [ConnectionPurpose, string][];

export const INTEREST_TAG_LABEL: Record<InterestTag, string> = {
  flowers: '花',
  coffee: 'コーヒー',
  walking: '散歩',
  art: 'アート',
  reading: '読書',
  movies: '映画',
  music: '音楽',
  startup: '起業',
  management: '経営',
  investment: '投資',
  sports: 'スポーツ',
  fitness: 'フィットネス',
  travel: '旅行',
  photography: '写真',
  ai: 'AI',
  other: 'その他',
};

export const INTEREST_TAG_OPTIONS = Object.entries(INTEREST_TAG_LABEL) as [InterestTag, string][];

export const LIFE_PHASE_LABEL: Record<LifePhase, string> = {
  student: '学生',
  employee: '会社員',
  executive: '経営者',
  freelance: 'フリーランス',
  pre_startup: '起業準備中',
  job_change: '転職検討中',
  parenting: '子育て中',
  second_career: 'セカンドキャリア',
  retired: 'リタイア後',
  other: 'その他',
};

export const LIFE_PHASE_OPTIONS = Object.entries(LIFE_PHASE_LABEL) as [LifePhase, string][];

export const VALUE_TAG_LABEL: Record<ValueTag, string> = {
  freedom: '自由',
  challenge: '挑戦',
  stability: '安定',
  family: '家族',
  fellowship: '仲間',
  growth: '成長',
  creation: '創作',
  contribution: '社会貢献',
  learning: '学び',
  health: '健康',
  work: '仕事',
  travel: '旅',
  aesthetics: '美意識',
};

export const VALUE_TAG_OPTIONS = Object.entries(VALUE_TAG_LABEL) as [ValueTag, string][];

export { PERSONALITY_TYPE_META, formatPersonalityAxes } from '@/lib/connection/personality';

export const EVENT_CATEGORY_LABEL: Record<ConnectionEventCategory, string> = {
  flower: 'Flower Connection',
  coffee: 'Coffee Connection',
  business: 'Dinner Connection',
  walking: 'Walking Connection',
  fitness: 'Fitness Connection',
  learning: 'Learning Connection',
  bar: 'Bar Connection',
  sports: 'Sports Connection',
  workshop: 'Workshop Connection',
  other: 'Connection',
};

/** ランディング / 一覧フィルタで見せる運営キュレーションの基本カテゴリー（5種） */
export const EVENT_CATEGORY_ORDER: ConnectionEventCategory[] = [
  'flower',
  'coffee',
  'business',
  'walking',
  'fitness',
];

/** イベント作成で選べる全カテゴリー（ユーザー作成向け） */
export const EVENT_CATEGORY_CREATE_ORDER: ConnectionEventCategory[] = [
  'flower',
  'coffee',
  'business',
  'walking',
  'fitness',
  'learning',
  'bar',
  'sports',
  'workshop',
  'other',
];

/** Hostバッジの表示メタ（UIのみ・ダミー） */
export const HOST_BADGE_META: Record<
  import('@/lib/connection/types').HostBadge,
  { label: string; emoji: string; description: string }
> = {
  community: {
    label: 'Community Host',
    emoji: '🌱',
    description: 'コミュニティづくりに貢献しているホスト',
  },
  trusted: {
    label: 'Trusted Host',
    emoji: '🤝',
    description: '安心して参加できると評価されたホスト',
  },
  premium: {
    label: 'Premium Host',
    emoji: '✦',
    description: '上質な体験を継続して届けているホスト',
  },
};

/** カテゴリごとの世界観（絵文字・キャッチ・配色・LP画像） */
export const EVENT_CATEGORY_META: Record<
  ConnectionEventCategory,
  {
    label: string;
    short: string;
    emoji: string;
    tagline: string;
    landingTagline: string;
    imagePath: string;
    accent: string;
    gradient: string;
  }
> = {
  flower: {
    label: 'Flower Connection',
    short: 'Flower',
    emoji: '🌸',
    tagline: '花を介して、心をひらく時間',
    landingTagline: '花と人がつながるやさしい時間',
    imagePath: '/images/category-flower.jpg',
    accent: '#c1738a',
    gradient: 'from-[#f7e7ec] to-[#efd6df]',
  },
  coffee: {
    label: 'Coffee Connection',
    short: 'Coffee',
    emoji: '☕️',
    tagline: '一杯のコーヒーから始まる対話',
    landingTagline: '一杯のコーヒーから会話が生まれる',
    imagePath: '/images/category-coffee.jpg',
    accent: '#9a6f4a',
    gradient: 'from-[#f1e8df] to-[#e6d5c2]',
  },
  business: {
    label: 'Dinner Connection',
    short: 'Dinner',
    emoji: '🍽️',
    tagline: '食卓を囲み、人生を語り合う夜',
    landingTagline: '美味しい食事と素敵な出会いを',
    imagePath: '/images/category-dinner.jpg',
    accent: '#7a6f63',
    gradient: 'from-[#efece8] to-[#ddd6cc]',
  },
  walking: {
    label: 'Walking Connection',
    short: 'Walking',
    emoji: '🍃',
    tagline: '歩きながら、自然と言葉がほどける',
    landingTagline: '自然の中で心地よくつながる',
    imagePath: '/images/category-walking.jpg',
    accent: '#5f8a5a',
    gradient: 'from-[#e8f0e4] to-[#d6e4cf]',
  },
  fitness: {
    label: 'Fitness Connection',
    short: 'Fitness',
    emoji: '🤸',
    tagline: '体を動かしたあとの、軽やかな会話',
    landingTagline: '体を動かして前向きなつながりを',
    imagePath: '/images/category-fitness.jpg',
    accent: '#5a7f99',
    gradient: 'from-[#e4eef3] to-[#cfdfe8]',
  },
  learning: {
    label: 'Learning Connection',
    short: 'Learning',
    emoji: '📚',
    tagline: '学びを分かち合い、視点を広げる時間',
    landingTagline: '学びを通じて知的なつながりを',
    imagePath: '',
    accent: '#6a6391',
    gradient: 'from-[#ece8f2] to-[#ddd6ea]',
  },
  bar: {
    label: 'Bar Connection',
    short: 'Bar',
    emoji: '🍷',
    tagline: '一杯を傾けながら、本音で語る夜',
    landingTagline: 'お酒とともに心ほどける夜を',
    imagePath: '',
    accent: '#8a5a63',
    gradient: 'from-[#f0e6e8] to-[#e2d0d4]',
  },
  sports: {
    label: 'Sports Connection',
    short: 'Sports',
    emoji: '🎾',
    tagline: '一緒に体を動かし、自然と打ち解ける',
    landingTagline: 'スポーツで心地よくつながる',
    imagePath: '',
    accent: '#5f8a72',
    gradient: 'from-[#e6f0ea] to-[#d2e2d8]',
  },
  workshop: {
    label: 'Workshop Connection',
    short: 'Workshop',
    emoji: '🎨',
    tagline: '手を動かしながら、自然に生まれる対話',
    landingTagline: '手を動かしてつくる時間を共に',
    imagePath: '',
    accent: '#a07a4a',
    gradient: 'from-[#f2ebde] to-[#e4d6c2]',
  },
  other: {
    label: 'Connection',
    short: 'Other',
    emoji: '✨',
    tagline: 'テーマを超えて、心地よくつながる',
    landingTagline: 'あなたらしいConnectionを',
    imagePath: '',
    accent: '#7a7468',
    gradient: 'from-[#efece8] to-[#ddd6cc]',
  },
};

export const LANDING_HERO_IMAGE = '/images/hanakai-hero.jpg';

function seedValues(partial: Partial<ProfileValues>): ProfileValues {
  return {
    mostImportant: partial.mostImportant ?? '',
    currentChallenge: partial.currentChallenge ?? '',
    futureGoal: partial.futureGoal ?? '',
    recentInspiration: partial.recentInspiration ?? '',
    howOthersSeeMe: partial.howOthersSeeMe ?? '',
    personalityOneWord: partial.personalityOneWord ?? '',
    coreValues: partial.coreValues ?? '',
    valueTags: partial.valueTags ?? [],
  };
}

function seedTrust(partial: Partial<MemberTrustVerificationFields>): MemberTrustVerificationFields {
  return {
    trustVerificationStatus: partial.trustVerificationStatus ?? 'pending',
    identityVerified: partial.identityVerified ?? false,
    identityVerificationDate: partial.identityVerificationDate ?? null,
    trustVerificationDate: partial.trustVerificationDate ?? null,
    trustNotes: partial.trustNotes ?? null,
    safetyFlags: partial.safetyFlags ?? [],
    verificationSource: partial.verificationSource ?? 'none',
    identityVerificationMethod: partial.identityVerificationMethod ?? 'none',
    externalVerificationRef: partial.externalVerificationRef ?? null,
    documentUploadStatus: partial.documentUploadStatus ?? 'none',
  };
}

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
    values: seedValues({
      mostImportant: '大切な人との時間と、自分らしさを大切にすること',
      currentChallenge: '仕事とプライベートの境界を見直している',
      futureGoal: '地域の小さなコミュニティをつくりたい',
      recentInspiration: '知らない人との会話から新しい視点が生まれたこと',
      howOthersSeeMe: '落ち着いていて、聞き上手',
      personalityOneWord: '穏やか',
      coreValues: '誠実さ、好奇心、余白',
      valueTags: ['freedom', 'growth', 'aesthetics', 'fellowship'],
    }),
    purposes: ['new_friends', 'life_stimulus', 'cross_industry'],
    interestTags: ['coffee', 'art', 'reading', 'travel'],
    lifePhase: 'employee',
    personality: {
      type: 'supporter',
      axes: { energy: 'introvert', thinking: 'feeling', planning: 'plan' },
      completedAt: '2026-06-01T10:00:00+09:00',
    },
    hostBadges: ['community', 'trusted'],
    ...seedTrust({
      trustVerificationStatus: 'verified',
      identityVerified: true,
      identityVerificationDate: '2026-05-28T10:00:00+09:00',
      trustVerificationDate: '2026-06-01T14:00:00+09:00',
      verificationSource: 'id_plus_public_info',
      safetyFlags: ['SNS確認済', '公開情報確認済'],
      trustNotes: '本人確認書類・LinkedIn・過去の登壇情報を確認。問題なし。',
    }),
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
    values: seedValues({
      mostImportant: '挑戦し続けることと、チームの信頼',
      currentChallenge: '新規事業の立ち上げと資金調達',
      futureGoal: '社会に残るプロダクトをつくる',
      recentInspiration: '若手メンバーの成長を間近で見たこと',
      howOthersSeeMe: '熱量が高い、頼れる',
      personalityOneWord: '挑戦者',
      coreValues: '行動力、学び、オープンマインド',
      valueTags: ['challenge', 'growth', 'work', 'fellowship'],
    }),
    purposes: ['cross_industry', 'learning', 'mutual_support'],
    interestTags: ['startup', 'management', 'coffee', 'ai'],
    lifePhase: 'executive',
    personality: {
      type: 'challenger',
      axes: { energy: 'extravert', thinking: 'logic', planning: 'plan' },
      completedAt: '2026-05-20T10:00:00+09:00',
    },
    hostBadges: ['premium', 'trusted'],
    ...seedTrust({
      trustVerificationStatus: 'verified',
      identityVerified: true,
      identityVerificationDate: '2026-05-15T10:00:00+09:00',
      trustVerificationDate: '2026-05-18T11:00:00+09:00',
      verificationSource: 'id_plus_public_info',
      safetyFlags: ['公開情報確認済', '過去メディア掲載確認済'],
      trustNotes: 'スタートアップ関連の公開情報と本人確認を照合済み。',
    }),
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
    values: seedValues({
      mostImportant: '創造性と、心地よい人間関係',
      currentChallenge: '新しい環境でのキャリア構築',
      futureGoal: 'デザインで誰かの人生を豊かにしたい',
      recentInspiration: '街角の小さなギャラリー',
      howOthersSeeMe: 'センスがいい、優しい',
      personalityOneWord: '感性派',
      coreValues: '美しさ、共感、成長',
    }),
    purposes: ['new_friends', 'hobby_buddies', 'learning'],
    interestTags: ['art', 'coffee', 'photography', 'movies'],
    lifePhase: 'job_change',
    personality: {
      type: 'creator',
      axes: { energy: 'introvert', thinking: 'feeling', planning: 'flexible' },
      completedAt: '2026-06-05T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'reviewing',
      identityVerified: true,
      identityVerificationDate: '2026-06-04T09:00:00+09:00',
      verificationSource: 'id_only',
      safetyFlags: ['追加確認必要'],
      trustNotes: '本人確認済み。公開情報の追加確認中。',
    }),
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
    values: seedValues({
      mostImportant: '家族との時間と、健康',
      currentChallenge: '仕事のペースを整えること',
      futureGoal: 'セカンドキャリアで地域に貢献したい',
      recentInspiration: '朝の散歩で出会った桜',
      howOthersSeeMe: '穏やかで頼りになる',
      personalityOneWord: '堅実',
      coreValues: '誠実、バランス、継続',
    }),
    purposes: ['hobby_buddies', 'local_community', 'new_friends'],
    interestTags: ['walking', 'coffee', 'reading', 'travel'],
    lifePhase: 'second_career',
    personality: {
      type: 'supporter',
      axes: { energy: 'introvert', thinking: 'feeling', planning: 'plan' },
      completedAt: '2026-05-15T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'verified',
      identityVerified: true,
      identityVerificationDate: '2026-05-10T10:00:00+09:00',
      trustVerificationDate: '2026-05-12T16:00:00+09:00',
      verificationSource: 'id_plus_public_info',
      safetyFlags: ['SNS確認済', '公開情報確認済'],
    }),
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
    values: seedValues({
      mostImportant: '言葉の力と、深い対話',
      currentChallenge: '孤独感との向き合い方',
      futureGoal: '本を書くこと',
      recentInspiration: '長いインタビュー記事を読んだこと',
      howOthersSeeMe: '物静か、芯がある',
      personalityOneWord: '内省',
      coreValues: '真実、深さ、表現',
    }),
    purposes: ['new_friends', 'mutual_support', 'learning'],
    interestTags: ['reading', 'coffee', 'movies', 'music'],
    lifePhase: 'freelance',
    personality: {
      type: 'creator',
      axes: { energy: 'introvert', thinking: 'feeling', planning: 'flexible' },
      completedAt: '2026-06-08T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'pending',
      identityVerified: false,
      verificationSource: 'none',
    }),
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
    values: seedValues({
      mostImportant: '技術で社会に貢献すること',
      currentChallenge: '副業でプロダクトを立ち上げている',
      futureGoal: '自分のサービスで100人の人生を変えたい',
      recentInspiration: 'オープンソースコミュニティの協力',
      howOthersSeeMe: '論理的、真面目',
      personalityOneWord: '探究',
      coreValues: '論理、挑戦、協力',
    }),
    purposes: ['cross_industry', 'learning', 'life_stimulus'],
    interestTags: ['ai', 'startup', 'coffee', 'fitness'],
    lifePhase: 'pre_startup',
    personality: {
      type: 'challenger',
      axes: { energy: 'extravert', thinking: 'logic', planning: 'plan' },
      completedAt: '2026-06-02T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'verified',
      identityVerified: true,
      identityVerificationDate: '2026-05-30T10:00:00+09:00',
      trustVerificationDate: '2026-06-01T09:00:00+09:00',
      verificationSource: 'id_plus_public_info',
      safetyFlags: ['公開情報確認済'],
    }),
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
    values: seedValues({
      mostImportant: '人の可能性を引き出すこと',
      currentChallenge: '新規事業のパートナー探し',
      futureGoal: '女性起業家の支援',
      recentInspiration: '後輩の独立',
      howOthersSeeMe: '頼もしい、つながり屋',
      personalityOneWord: 'つなぐ',
      coreValues: '信頼、挑戦、多様性',
    }),
    purposes: ['cross_industry', 'mutual_support', 'learning'],
    interestTags: ['management', 'startup', 'coffee', 'travel'],
    lifePhase: 'executive',
    personality: {
      type: 'explorer',
      axes: { energy: 'extravert', thinking: 'feeling', planning: 'flexible' },
      completedAt: '2026-05-25T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'reviewing',
      identityVerified: true,
      identityVerificationDate: '2026-06-01T10:00:00+09:00',
      verificationSource: 'id_only',
      safetyFlags: ['SNS確認済'],
      trustNotes: 'SNS確認完了。公開情報の最終確認待ち。',
    }),
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
    values: seedValues({
      mostImportant: '地域コミュニティの活性化',
      currentChallenge: '店舗のデジタル化',
      futureGoal: '鎌倉に新しい居場所をつくる',
      recentInspiration: '地元の祭り',
      howOthersSeeMe: '地元愛が強い、話しやすい',
      personalityOneWord: '地域密着',
      coreValues: '地域、つながり、継続',
    }),
    purposes: ['local_community', 'cross_industry', 'hobby_buddies'],
    interestTags: ['flowers', 'coffee', 'walking', 'management'],
    lifePhase: 'executive',
    personality: {
      type: 'explorer',
      axes: { energy: 'extravert', thinking: 'feeling', planning: 'flexible' },
      completedAt: '2026-06-03T10:00:00+09:00',
    },
    ...seedTrust({
      trustVerificationStatus: 'rejected',
      identityVerified: true,
      identityVerificationDate: '2026-06-02T10:00:00+09:00',
      verificationSource: 'id_only',
      safetyFlags: ['追加確認必要'],
      trustNotes: '公開情報との不一致あり。再確認の連絡済み。',
    }),
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
    title: 'Dinner Connection — 丸の内',
    category: 'business',
    startAt: '2026-07-05T18:30:00+09:00',
    area: '東京・丸の内',
    venue: 'MARUNOUCHI LOUNGE',
    capacity: 6,
    reservedCount: 3,
    hostName: 'HANAKAI Connection 運営',
    conditions: '事業・キャリアに関心がある方・名刺不要',
    description: '堅い交流会ではありません。食卓を囲みながら、仕事の話も、人生の話も。プライベートなDinner Connection。',
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
  {
    id: 'ue1',
    title: '朝の花あしらいと珈琲 — 南青山',
    category: 'flower',
    startAt: '2026-07-12T10:00:00+09:00',
    area: '東京・南青山',
    venue: 'アトリエ&カフェ AOYAMA',
    capacity: 6,
    reservedCount: 3,
    hostName: 'あやか',
    hostId: 'm1',
    isUserCreated: true,
    approvalMode: 'host_approval',
    fee: 3500,
    conditions: '初参加歓迎・一人参加OK・花が好きな方',
    description:
      '季節の花を少しだけあしらってから、淹れたての珈琲を片手にゆっくり語り合う朝。人を集める会ではなく、心地よいつながりが生まれる小さな時間を一緒につくれたら嬉しいです。',
    coverUrl: img('photo-1487070183336-b863922373d4'),
    status: 'open',
    isPast: false,
    confirmedMemberIds: [],
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
  {
    id: 'a10',
    eventId: 'ue1',
    memberId: 'm3',
    appliedAt: '2026-06-24T10:00:00+09:00',
    status: 'pending',
    reason:
      '最近お花のある暮らしに憧れていて、自分でも少しずつ生けるようになりました。同じように静かな時間を楽しめる方とゆっくりお話ししてみたいと思い、参加を希望します。朝の珈琲も大好きなので楽しみです。',
  },
  {
    id: 'a11',
    eventId: 'ue1',
    memberId: 'm5',
    appliedAt: '2026-06-24T14:30:00+09:00',
    status: 'pending',
    reason:
      '転職をきっかけに新しいつながりを探しています。花も珈琲も初心者ですが、丁寧な時間を過ごせそうな雰囲気に惹かれました。気負わずいろいろな方と落ち着いて話してみたいです。よろしくお願いします。',
  },
  {
    id: 'a12',
    eventId: 'ue1',
    memberId: 'm7',
    appliedAt: '2026-06-25T09:15:00+09:00',
    status: 'pending',
    reason:
      '休日に心が整うような時間を持ちたいと思っていました。花をあしらう体験は初めてですが、同じ感性の方々とゆったり語り合えたら嬉しいです。少し人見知りですが、温かい場づくりに参加できたらと思っています。',
  },
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

export function applyToEvent(eventId: string, memberId: string, reason?: string) {
  if (getApplication(eventId, memberId)) return;
  const event = getEvent(eventId);
  const autoApprove = event?.approvalMode === 'auto';
  applications.push({
    id: `a${Date.now()}`,
    eventId,
    memberId,
    appliedAt: new Date().toISOString(),
    status: autoApprove ? 'confirmed' : 'pending',
    reason: reason?.trim() ? reason.trim() : undefined,
  });
  if (event) {
    event.reservedCount = Math.min(event.capacity, event.reservedCount + 1);
    if (autoApprove && !event.confirmedMemberIds.includes(memberId)) {
      event.confirmedMemberIds.push(memberId);
    }
  }
}

/** 申請を却下（主催者承認制のホスト操作） */
export function rejectApplication(eventId: string, memberId: string) {
  const event = getEvent(eventId);
  const app = getApplication(eventId, memberId);
  if (app) app.status = 'rejected';
  if (event) {
    event.confirmedMemberIds = event.confirmedMemberIds.filter((id) => id !== memberId);
  }
}

export type CreateEventInput = {
  title: string;
  category: ConnectionEventCategory;
  description: string;
  startAt: string;
  area: string;
  venue: string;
  capacity: number;
  fee: number;
  coverUrl: string;
  conditions: string;
  approvalMode: import('@/lib/connection/types').EventApprovalMode;
  hostId: string;
};

/** ユーザー作成イベントを追加（MVP: インメモリ） */
export function createEvent(input: CreateEventInput): ConnectionEvent {
  const host = getMember(input.hostId);
  const event: ConnectionEvent = {
    id: `ue_${Date.now()}`,
    title: input.title,
    category: input.category,
    startAt: input.startAt,
    area: input.area,
    venue: input.venue,
    capacity: input.capacity,
    reservedCount: 0,
    hostName: host?.nickname ?? 'HANAKAI ホスト',
    hostId: input.hostId,
    isUserCreated: true,
    approvalMode: input.approvalMode,
    fee: input.fee,
    conditions: input.conditions,
    description: input.description,
    coverUrl: input.coverUrl,
    status: 'open',
    isPast: false,
    confirmedMemberIds: [],
  };
  events.push(event);
  return event;
}

/** 指定メンバーが主催するイベント一覧 */
export function listEventsByHost(hostId: string) {
  return listEvents().filter((e) => e.hostId === hostId);
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

/** プロフィール更新（MVP: インメモリ） */
export function updateMember(id: string, patch: Partial<Omit<ConnectionMember, 'id'>>) {
  const idx = members.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  members[idx] = { ...members[idx], ...patch };
  return members[idx];
}

export function saveMemberPersonality(id: string, personality: PersonalityProfile) {
  return updateMember(id, { personality });
}

export function updateMemberTrust(
  id: string,
  patch: {
    trustVerificationStatus?: TrustVerificationStatus;
    trustNotes?: string | null;
    safetyFlags?: string[];
    verificationSource?: VerificationSource;
    identityVerified?: boolean;
  },
) {
  const member = getMember(id);
  if (!member) return null;

  const now = new Date().toISOString();
  const status = patch.trustVerificationStatus ?? member.trustVerificationStatus;

  return updateMember(id, {
    trustVerificationStatus: status,
    trustNotes: patch.trustNotes !== undefined ? patch.trustNotes : member.trustNotes,
    safetyFlags: patch.safetyFlags ?? member.safetyFlags,
    verificationSource: patch.verificationSource ?? member.verificationSource,
    identityVerified: patch.identityVerified ?? member.identityVerified,
    trustVerificationDate:
      status === 'verified' && member.trustVerificationStatus !== 'verified'
        ? now
        : member.trustVerificationDate,
    identityVerificationDate:
      patch.identityVerified && !member.identityVerified ? now : member.identityVerificationDate,
  });
}

/** 将来のAIグルーピング用スナップショット */
export function getGroupingProfile(memberId: string): MemberGroupingProfile | null {
  const m = getMember(memberId);
  if (!m) return null;
  return {
    memberId: m.id,
    demographics: { age: m.age, gender: m.gender, occupation: m.occupation, lifePhase: m.lifePhase },
    values: m.values,
    purposes: m.purposes,
    interestTags: m.interestTags,
    personality: m.personality,
    trust: {
      trustVerificationStatus: m.trustVerificationStatus,
      identityVerified: m.identityVerified,
      verificationSource: m.verificationSource,
      safetyFlags: m.safetyFlags,
    },
  };
}
