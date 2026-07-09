/** Bloom Profile — ユーザー向け表示ラベル（英語の内部名は出さない） */

export const BLOOM_SECTION_LABELS = {
  summary: 'あなたらしさの紹介',
  aiIntro: '自己紹介文',
  conversationStarters: '話しかけるきっかけ',
  tags: '興味・関心タグ',
  connectionStyle: '話し方・つながり方',
} as const;

export const BLOOM_VISIBILITY_OPTIONS = [
  { name: 'showBloomSummary', label: 'あなたらしさの紹介文を公開する' },
  { name: 'showAiIntro', label: 'AIが整えた自己紹介文を公開する' },
  { name: 'showConversationStarters', label: '話しかけるきっかけを公開する' },
  { name: 'showBloomTags', label: '興味・関心タグを公開する' },
  { name: 'showConnectionStyle', label: '話し方・つながり方の特徴を公開する' },
] as const;

export const BLOOM_VISIBILITY_NOTE =
  '公開すると、他の参加者があなたの人柄を知りやすくなります。公開したくない項目はOFFにできます。';

export const PROFILE_PHOTO_GUIDE =
  'HANAKAIでは、安心してリアルに会えるConnectionを大切にしています。顔が分かる写真があると、主催者や参加者が安心して参加しやすくなります。';

export const PROFILE_PHOTO_GUIDE_NOTE = '※写真登録は任意です。';

export const PROFILE_PHOTO_EMPTY_TITLE = 'プロフィール写真が未登録です';

export const PROFILE_PHOTO_EMPTY_BODY =
  '顔写真を登録すると、イベント参加時に相手が安心しやすくなります。';
