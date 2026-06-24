import type { PersonalityAxes, PersonalityType } from '@/lib/connection/types';

export type QuizQuestion = {
  id: string;
  text: string;
  optionA: { label: string; axis: keyof PersonalityAxes; value: PersonalityAxes[keyof PersonalityAxes] };
  optionB: { label: string; axis: keyof PersonalityAxes; value: PersonalityAxes[keyof PersonalityAxes] };
};

/** 6問・3軸（外向/内向・論理/感覚・計画/柔軟）の簡易性格診断 */
export const PERSONALITY_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    text: '初対面の6人との集まりでは、',
    optionA: { label: '積極的に話しかける方だ', axis: 'energy', value: 'extravert' },
    optionB: { label: '様子を見てから話す方だ', axis: 'energy', value: 'introvert' },
  },
  {
    id: 'q2',
    text: '新しい場所では、',
    optionA: { label: 'すぐに輪の中に入っていく', axis: 'energy', value: 'extravert' },
    optionB: { label: '一対一の会話から始めたい', axis: 'energy', value: 'introvert' },
  },
  {
    id: 'q3',
    text: '物事を判断するとき、',
    optionA: { label: '事実と論理を重視する', axis: 'thinking', value: 'logic' },
    optionB: { label: '相手の気持ちを重視する', axis: 'thinking', value: 'feeling' },
  },
  {
    id: 'q4',
    text: '意見が分かれたとき、',
    optionA: { label: '筋道を立てて整理したい', axis: 'thinking', value: 'logic' },
    optionB: { label: '関係性を大切にしたい', axis: 'thinking', value: 'feeling' },
  },
  {
    id: 'q5',
    text: '週末の過ごし方は、',
    optionA: { label: '予定を決めて動く方が好き', axis: 'planning', value: 'plan' },
    optionB: { label: 'その場の流れに任せたい', axis: 'planning', value: 'flexible' },
  },
  {
    id: 'q6',
    text: '新しい挑戦に対して、',
    optionA: { label: '計画を立ててから動く', axis: 'planning', value: 'plan' },
    optionB: { label: 'まず試してみて考える', axis: 'planning', value: 'flexible' },
  },
];

export const PERSONALITY_TYPE_META: Record<
  PersonalityType,
  { label: string; description: string }
> = {
  explorer: {
    label: 'Explorer',
    description: '新しい出会いと体験を求める探索者。柔軟で外向的。',
  },
  creator: {
    label: 'Creator',
    description: '内省と感性でつながる創造者。深い対話を好む。',
  },
  supporter: {
    label: 'Supporter',
    description: '相手を支え、関係を育てる支援者。共感力が高い。',
  },
  challenger: {
    label: 'Challenger',
    description: '論理と計画で前に進む挑戦者。刺激を求める。',
  },
};

export function scorePersonalityAnswers(answers: Record<string, 'A' | 'B'>): {
  axes: PersonalityAxes;
  type: PersonalityType;
} {
  const scores = {
    energy: { extravert: 0, introvert: 0 },
    thinking: { logic: 0, feeling: 0 },
    planning: { plan: 0, flexible: 0 },
  };

  for (const q of PERSONALITY_QUIZ) {
    const choice = answers[q.id];
    if (!choice) continue;
    const opt = choice === 'A' ? q.optionA : q.optionB;
    const bucket = scores[opt.axis] as Record<string, number>;
    bucket[opt.value] += 1;
  }

  const axes: PersonalityAxes = {
    energy: scores.energy.extravert >= scores.energy.introvert ? 'extravert' : 'introvert',
    thinking: scores.thinking.logic >= scores.thinking.feeling ? 'logic' : 'feeling',
    planning: scores.planning.plan >= scores.planning.flexible ? 'plan' : 'flexible',
  };

  const type = resolvePersonalityType(axes);
  return { axes, type };
}

function resolvePersonalityType(axes: PersonalityAxes): PersonalityType {
  const { energy, thinking, planning } = axes;
  if (energy === 'extravert' && planning === 'flexible') return 'explorer';
  if (energy === 'introvert' && thinking === 'feeling') return 'creator';
  if (thinking === 'feeling' && planning === 'plan') return 'supporter';
  return 'challenger';
}

export function formatPersonalityAxes(axes: PersonalityAxes) {
  return [
    axes.energy === 'extravert' ? '外向型' : '内向型',
    axes.thinking === 'logic' ? '論理型' : '感覚型',
    axes.planning === 'plan' ? '計画型' : '柔軟型',
  ].join(' · ');
}
