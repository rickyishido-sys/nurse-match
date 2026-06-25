import type {
  ConnectionPurpose,
  InterestTag,
  LifePhase,
  PersonalityAxes,
  PersonalityType,
  ValueTag,
} from '@/lib/connection/types';

/** 選択肢: コードと表示ラベルの組（オンボーディング用） */
export type Option<T extends string = string> = { value: T; label: string };

/** 5. 職業（既存 LifePhase enum にマッピングして保存） */
export const OCCUPATION_OPTIONS: Option<LifePhase>[] = [
  { value: 'employee', label: '会社員' },
  { value: 'executive', label: '経営者・役員' },
  { value: 'freelance', label: '個人事業主・フリーランス' },
  { value: 'second_career', label: '医療・福祉' },
  { value: 'pre_startup', label: 'クリエイター' },
  { value: 'student', label: '学生' },
  { value: 'parenting', label: '主婦・主夫' },
  { value: 'job_change', label: '休職中・転職活動中' },
  { value: 'other', label: 'その他' },
];

/** 6. 人生フェーズ（マインドセット・values.currentPhase に保存） */
export const LIFE_PHASE_MINDSET_OPTIONS: Option[] = [
  { value: '仕事を頑張っている', label: '仕事を頑張っている' },
  { value: '新しい挑戦をしている', label: '新しい挑戦をしている' },
  { value: '生活を整えている', label: '生活を整えている' },
  { value: '人とのつながりを増やしたい', label: '人とのつながりを増やしたい' },
  { value: '趣味や感性を広げたい', label: '趣味や感性を広げたい' },
  { value: '少し立ち止まって考えている', label: '少し立ち止まって考えている' },
  { value: '変化の途中にいる', label: '変化の途中にいる' },
];

/** 7. 休日の過ごし方（既存 InterestTag enum） */
export const WEEKEND_OPTIONS: Option<InterestTag>[] = [
  { value: 'walking', label: '散歩' },
  { value: 'coffee', label: 'カフェ' },
  { value: 'flowers', label: '花・植物' },
  { value: 'art', label: '美術館' },
  { value: 'movies', label: '映画' },
  { value: 'reading', label: '読書' },
  { value: 'music', label: '音楽' },
  { value: 'food_walk', label: '食べ歩き' },
  { value: 'cooking', label: '料理' },
  { value: 'drinks', label: 'お酒' },
  { value: 'sauna', label: 'サウナ' },
  { value: 'travel', label: '旅行' },
  { value: 'sports', label: 'スポーツ' },
  { value: 'fitness', label: 'ジム' },
  { value: 'camping', label: 'キャンプ' },
  { value: 'games', label: 'ゲーム' },
  { value: 'home_relax', label: '家でゆっくり' },
  { value: 'friends', label: '友人と会う' },
];

/** 8. 興味のある体験（values.experiences に保存） */
export const EXPERIENCE_OPTIONS: Option[] = [
  { value: 'flower', label: 'Flower' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'walking', label: 'Walking' },
  { value: 'fitness', label: 'Fitness' },
];

/** 9. 求めているConnection（既存 ConnectionPurpose enum） */
export const DESIRED_CONNECTION_OPTIONS: Option<ConnectionPurpose>[] = [
  { value: 'casual_talk', label: '気軽に話せる人' },
  { value: 'new_perspective', label: '新しい視点をくれる人' },
  { value: 'shared_values', label: '価値観が近い人' },
  { value: 'different_world', label: '自分と違う世界を持っている人' },
  { value: 'life_stimulus', label: '仕事や人生の刺激になる人' },
  { value: 'calm_time', label: '穏やかな時間を過ごせる人' },
  { value: 'lasting', label: '長く関係が続きそうな人' },
];

/** 10. 価値観タグ（既存 ValueTag enum・最大3つ） */
export const VALUE_TAG_ONBOARDING_OPTIONS: Option<ValueTag>[] = [
  { value: 'sincerity', label: '誠実さ' },
  { value: 'care', label: '丁寧さ' },
  { value: 'freedom', label: '自由' },
  { value: 'challenge', label: '挑戦' },
  { value: 'reassurance', label: '安心感' },
  { value: 'curiosity', label: '好奇心' },
  { value: 'sensibility', label: '感性' },
  { value: 'growth', label: '成長' },
  { value: 'calm', label: '穏やかさ' },
  { value: 'humor', label: 'ユーモア' },
  { value: 'deep_talk', label: '深い会話' },
  { value: 'authentic', label: '自然体' },
  { value: 'space', label: '余白' },
  { value: 'trust', label: '信頼' },
  { value: 'continuity', label: '継続' },
];

/** 15. 性格タイプ（雰囲気選択 → PersonalityType + axes にマッピング） */
export type TemperamentOption = {
  value: string;
  label: string;
  type: PersonalityType;
  axes: PersonalityAxes;
};

export const TEMPERAMENT_OPTIONS: TemperamentOption[] = [
  {
    value: 'calm_listener',
    label: '穏やかに聞くタイプ',
    type: 'supporter',
    axes: { energy: 'introvert', thinking: 'feeling', planning: 'flexible' },
  },
  {
    value: 'bright_host',
    label: '明るく場を作るタイプ',
    type: 'explorer',
    axes: { energy: 'extravert', thinking: 'feeling', planning: 'flexible' },
  },
  {
    value: 'deep_thinker',
    label: '深く考えるタイプ',
    type: 'creator',
    axes: { energy: 'introvert', thinking: 'logic', planning: 'plan' },
  },
  {
    value: 'curious_mover',
    label: '好奇心で動くタイプ',
    type: 'explorer',
    axes: { energy: 'extravert', thinking: 'logic', planning: 'flexible' },
  },
  {
    value: 'careful_nurturer',
    label: '丁寧に関係を育てるタイプ',
    type: 'supporter',
    axes: { energy: 'introvert', thinking: 'feeling', planning: 'plan' },
  },
  {
    value: 'intuitive',
    label: '直感を大切にするタイプ',
    type: 'creator',
    axes: { energy: 'introvert', thinking: 'feeling', planning: 'flexible' },
  },
];

/** 4. 居住地（都道府県） */
export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
  '海外・その他',
] as const;
