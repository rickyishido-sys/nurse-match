/** ユーザー向け表示ラベル（内部名 Bloom は出さない） */

export const BLOOM_SECTION_LABELS = {
  summary: 'あなたらしさ',
  aiIntro: '紹介文',
  conversationStarters: '話しかけるきっかけ',
  tags: '興味・関心',
  connectionStyle: '話し方の特徴',
} as const;

export const BLOOM_VISIBILITY_OPTIONS = [
  { name: 'showBloomSummary', label: 'あなたらしさを公開する' },
  { name: 'showAiIntro', label: '紹介文を公開する' },
  { name: 'showConversationStarters', label: '話しかけるきっかけを公開する' },
  { name: 'showBloomTags', label: '興味・関心を公開する' },
  { name: 'showConnectionStyle', label: '話し方の特徴を公開する' },
] as const;

export const BLOOM_VISIBILITY_NOTE =
  '公開すると、他の参加者があなたの人柄を知りやすくなります。公開したくない項目はオフにできます。';

export const PROFILE_PHOTO_GUIDE =
  'HANAKAIでは、安心してリアルに会えるつながりを大切にしています。顔が分かる写真があると、主催者や参加者が安心して参加しやすくなります。';

export const PROFILE_PHOTO_GUIDE_NOTE = '※写真登録は任意です。';

export const PROFILE_PHOTO_EMPTY_TITLE = 'プロフィール写真が未登録です';

export const PROFILE_PHOTO_EMPTY_BODY =
  'プロフィール写真があると、イベント当日に「この人だ」と分かりやすくなり、安心して話しかけてもらいやすくなります。';

export const PROFILE_TIMELINE_TITLE = 'あなたの記録';

export const PROFILE_TIMELINE_DESCRIPTION =
  'イベントへ参加するたびに、あなたの体験や出会いが少しずつ積み重なっていきます。';

export const BLOOM_GENERATE_BUTTON_LABEL = 'あなたらしさを整理する';

export const BLOOM_GENERATE_BUTTON_UPDATE_LABEL = 'あなたらしさを更新する';

export const BLOOM_GENERATE_BUTTON_DESCRIPTION =
  'プロフィールをもとに、紹介文・話しかけるきっかけ・興味や関心を整理します。';
