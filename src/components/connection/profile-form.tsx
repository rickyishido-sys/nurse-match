'use client';

import { useState } from 'react';
import { saveProfileAction } from '@/lib/connection/actions';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import {
  INTEREST_TAG_OPTIONS,
  LIFE_PHASE_OPTIONS,
  PERSONALITY_TYPE_META,
  PURPOSE_OPTIONS,
  VALUE_TAG_OPTIONS,
} from '@/lib/connection/data';
import {
  PERSONALITY_QUIZ,
  formatPersonalityAxes,
  scorePersonalityAnswers,
} from '@/lib/connection/personality';
import { TRUST_STATUS_LABEL_JA } from '@/lib/connection/trust';
import type { ConnectionMember, PersonalityAxes, PersonalityType } from '@/lib/connection/types';

type ProfileFormProps = {
  error?: string;
  member?: ConnectionMember | null;
};

const STEP_TITLES = [
  '基本情報',
  'あなたについて',
  '興味関心',
  '求めているConnection',
  '価値観',
  '深掘り質問',
  '性格診断',
];
const TOTAL = STEP_TITLES.length;

const fieldClass =
  'w-full rounded-2xl border border-[#e2ded7] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1a1a1a]';
const labelClass = 'text-sm font-medium text-[#1a1a1a]';

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ConnectionProfileForm({ error, member }: ProfileFormProps) {
  const v = member?.values;

  const [step, setStep] = useState(1);

  // 基本・自由記述（送信のため常時マウント）
  const [nickname, setNickname] = useState(member?.nickname ?? '');
  const [age, setAge] = useState(member?.age ? String(member.age) : '');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>(member?.gender ?? 'female');
  const [area, setArea] = useState(member?.area ?? '');
  const [occupation, setOccupation] = useState(member?.occupation ?? '');
  const [lifePhase, setLifePhase] = useState(member?.lifePhase ?? '');
  const [personalityOneWord, setPersonalityOneWord] = useState(v?.personalityOneWord ?? '');

  const [interest, setInterest] = useState<string[]>(member?.interestTags ?? []);
  const [purposes, setPurposes] = useState<string[]>(member?.purposes ?? []);
  const [valueTags, setValueTags] = useState<string[]>(v?.valueTags ?? []);

  const [bio, setBio] = useState(member?.bio ?? '');
  const [currentChallenge, setCurrentChallenge] = useState(v?.currentChallenge ?? '');
  const [futureGoal, setFutureGoal] = useState(v?.futureGoal ?? '');
  const [recentInspiration, setRecentInspiration] = useState(v?.recentInspiration ?? '');
  const [howOthersSeeMe, setHowOthersSeeMe] = useState(v?.howOthersSeeMe ?? '');

  // 性格診断
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [result, setResult] = useState<{ axes: PersonalityAxes; type: PersonalityType } | null>(
    member?.personality ? { axes: member.personality.axes, type: member.personality.type } : null,
  );

  const canProceed = step !== 1 || (nickname.trim().length > 0 && age.trim().length > 0);
  const progress = Math.round((step / TOTAL) * 100);

  function answerQuiz(choice: 'A' | 'B') {
    const q = PERSONALITY_QUIZ[qIndex];
    const next = { ...answers, [q.id]: choice };
    setAnswers(next);
    if (qIndex === PERSONALITY_QUIZ.length - 1) {
      setResult(scorePersonalityAnswers(next));
    } else {
      setQIndex((i) => i + 1);
    }
  }

  function retakeQuiz() {
    setQIndex(0);
    setAnswers({});
    setResult(null);
  }

  return (
    <form action={saveProfileAction} className='space-y-6'>
      {error === 'nickname' ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
          ニックネームを入力してください。
        </p>
      ) : null}

      {/* 進捗 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-[11px] text-[#9a9a9a]'>
          <span className='font-medium text-[#6b6b6b]'>
            Step {step} / {TOTAL} · {STEP_TITLES[step - 1]}
          </span>
          <span>{progress}%</span>
        </div>
        <div className='h-1.5 overflow-hidden rounded-full bg-[#ece8e1]'>
          <div className='h-full rounded-full bg-[#1a1a1a] transition-all duration-300' style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 隠しフィールド（常時送信） */}
      <input type='hidden' name='nickname' value={nickname} />
      <input type='hidden' name='age' value={age} />
      <input type='hidden' name='gender' value={gender} />
      <input type='hidden' name='area' value={area} />
      <input type='hidden' name='occupation' value={occupation} />
      <input type='hidden' name='lifePhase' value={lifePhase} />
      <input type='hidden' name='personalityOneWord' value={personalityOneWord} />
      <input type='hidden' name='bio' value={bio} />
      <input type='hidden' name='currentChallenge' value={currentChallenge} />
      <input type='hidden' name='futureGoal' value={futureGoal} />
      <input type='hidden' name='recentInspiration' value={recentInspiration} />
      <input type='hidden' name='howOthersSeeMe' value={howOthersSeeMe} />
      {interest.map((t) => (
        <input key={t} type='hidden' name='interestTags' value={t} />
      ))}
      {purposes.map((p) => (
        <input key={p} type='hidden' name='purposes' value={p} />
      ))}
      {valueTags.map((t) => (
        <input key={t} type='hidden' name='valueTags' value={t} />
      ))}
      {result ? (
        <>
          <input type='hidden' name='personalityType' value={result.type} />
          <input type='hidden' name='personalityEnergy' value={result.axes.energy} />
          <input type='hidden' name='personalityThinking' value={result.axes.thinking} />
          <input type='hidden' name='personalityPlanning' value={result.axes.planning} />
        </>
      ) : null}

      {/* Step 1: 基本情報 */}
      {step === 1 ? (
        <StepPanel title='基本情報' lead='まずは、あなたのことを少しだけ教えてください。'>
          {member ? (
            <div className='rounded-2xl border border-[#ebe9e4] bg-white p-4'>
              <p className='text-xs font-semibold text-[#1a1a1a]'>安全確認</p>
              <p className='mt-1 text-[11px] leading-5 text-[#6b6b6b]'>
                運営が参加者の本人確認と公開情報を確認し、安心して参加できる環境を整えています。
              </p>
              <TrustBadgeList member={member} className='mt-2' />
              <p className='mt-2 text-[11px] text-[#9a9a9a]'>
                現在のステータス: {TRUST_STATUS_LABEL_JA[member.trustVerificationStatus]}
              </p>
            </div>
          ) : null}

          <label className='grid gap-1.5'>
            <span className={labelClass}>ニックネーム</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={fieldClass} placeholder='例: あやか' />
          </label>

          <label className='grid gap-1.5'>
            <span className={labelClass}>年齢</span>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode='numeric'
              className={fieldClass}
              placeholder='32'
            />
          </label>

          <div className='grid gap-1.5'>
            <span className={labelClass}>性別</span>
            <div className='grid grid-cols-3 gap-2'>
              {([['female', '女性'], ['male', '男性'], ['other', 'その他']] as const).map(([value, label]) => (
                <SelectChip key={value} active={gender === value} onClick={() => setGender(value)}>
                  {label}
                </SelectChip>
              ))}
            </div>
          </div>

          <label className='grid gap-1.5'>
            <span className={labelClass}>居住地</span>
            <input value={area} onChange={(e) => setArea(e.target.value)} className={fieldClass} placeholder='例: 東京・渋谷' />
          </label>
        </StepPanel>
      ) : null}

      {/* Step 2: あなたについて */}
      {step === 2 ? (
        <StepPanel title='あなたについて' lead='お仕事や、今の人生フェーズを教えてください。'>
          <label className='grid gap-1.5'>
            <span className={labelClass}>職業</span>
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={fieldClass} placeholder='例: デザイナー' />
          </label>

          <div className='grid gap-1.5'>
            <span className={labelClass}>人生フェーズ</span>
            <div className='grid grid-cols-2 gap-2'>
              {LIFE_PHASE_OPTIONS.map(([value, label]) => (
                <SelectChip key={value} active={lifePhase === value} onClick={() => setLifePhase(value)}>
                  {label}
                </SelectChip>
              ))}
            </div>
          </div>

          <label className='grid gap-1.5'>
            <span className={labelClass}>自分の性格を一言で表すと？</span>
            <input
              value={personalityOneWord}
              onChange={(e) => setPersonalityOneWord(e.target.value)}
              className={fieldClass}
              placeholder='例: 穏やか / 挑戦的 / 好奇心旺盛'
            />
          </label>
        </StepPanel>
      ) : null}

      {/* Step 3: 興味関心 */}
      {step === 3 ? (
        <StepPanel title='興味関心' lead={`心が動くものを選んでください。${interest.length > 0 ? `（${interest.length}個選択中）` : ''}`}>
          <div className='flex flex-wrap gap-2'>
            {INTEREST_TAG_OPTIONS.map(([value, label]) => (
              <TagChip key={value} active={interest.includes(value)} onClick={() => setInterest((s) => toggle(s, value))}>
                {label}
              </TagChip>
            ))}
          </div>
        </StepPanel>
      ) : null}

      {/* Step 4: 求めているConnection */}
      {step === 4 ? (
        <StepPanel title='求めているConnection' lead='どんな出会いを求めていますか？（複数選択可）'>
          <div className='grid gap-2'>
            {PURPOSE_OPTIONS.map(([value, label]) => (
              <CardChoice key={value} active={purposes.includes(value)} onClick={() => setPurposes((s) => toggle(s, value))}>
                {label}
              </CardChoice>
            ))}
          </div>
        </StepPanel>
      ) : null}

      {/* Step 5: 価値観 */}
      {step === 5 ? (
        <StepPanel title='価値観' lead={`大切にしている価値観を選んでください。${valueTags.length > 0 ? `（${valueTags.length}個選択中）` : ''}`}>
          <div className='flex flex-wrap gap-2'>
            {VALUE_TAG_OPTIONS.map(([value, label]) => (
              <TagChip key={value} active={valueTags.includes(value)} onClick={() => setValueTags((s) => toggle(s, value))}>
                {label}
              </TagChip>
            ))}
          </div>
        </StepPanel>
      ) : null}

      {/* Step 6: 深掘り質問 */}
      {step === 6 ? (
        <StepPanel title='深掘り質問' lead='答えられるものだけで大丈夫です。あなたらしさが伝わります。'>
          <label className='grid gap-1.5'>
            <span className={labelClass}>ひとこと自己紹介</span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={fieldClass} placeholder='あなたについて、ひとことで' />
          </label>
          <label className='grid gap-1.5'>
            <span className={labelClass}>最近挑戦していること</span>
            <textarea value={currentChallenge} onChange={(e) => setCurrentChallenge(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className='grid gap-1.5'>
            <span className={labelClass}>今後やってみたいこと</span>
            <textarea value={futureGoal} onChange={(e) => setFutureGoal(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className='grid gap-1.5'>
            <span className={labelClass}>最近感動したこと</span>
            <textarea value={recentInspiration} onChange={(e) => setRecentInspiration(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className='grid gap-1.5'>
            <span className={labelClass}>人からどんな人だと言われますか？</span>
            <input value={howOthersSeeMe} onChange={(e) => setHowOthersSeeMe(e.target.value)} className={fieldClass} />
          </label>
        </StepPanel>
      ) : null}

      {/* Step 7: 性格診断 */}
      {step === 7 ? (
        <StepPanel title='性格診断' lead='最後に、かんたんな診断を。マッチングではなく、相互理解のための参考です。'>
          {result ? (
            <div className='space-y-4'>
              <div className='rounded-3xl border border-[#ebe9e4] bg-white p-6 text-center'>
                <p className='text-[11px] font-medium tracking-[0.2em] text-[#9a9a9a]'>あなたのConnectionタイプ</p>
                <p className='mt-2 text-2xl font-semibold text-[#1a1a1a]'>{PERSONALITY_TYPE_META[result.type].label}</p>
                <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>{PERSONALITY_TYPE_META[result.type].description}</p>
                <p className='mt-3 text-xs text-[#9a9a9a]'>{formatPersonalityAxes(result.axes)}</p>
              </div>
              <button type='button' onClick={retakeQuiz} className='w-full text-center text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>
                もう一度診断する
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between text-[11px] text-[#9a9a9a]'>
                <span>質問 {qIndex + 1} / {PERSONALITY_QUIZ.length}</span>
                <span>{Math.round(((qIndex + 1) / PERSONALITY_QUIZ.length) * 100)}%</span>
              </div>
              <div className='h-1 overflow-hidden rounded-full bg-[#ece8e1]'>
                <div className='h-full bg-[#1a1a1a] transition-all' style={{ width: `${((qIndex + 1) / PERSONALITY_QUIZ.length) * 100}%` }} />
              </div>
              <p className='text-sm font-semibold leading-7 text-[#1a1a1a]'>{PERSONALITY_QUIZ[qIndex].text}</p>
              <div className='space-y-2'>
                <button type='button' onClick={() => answerQuiz('A')} className='w-full rounded-2xl border border-[#e2ded7] bg-white px-4 py-3 text-left text-sm text-[#4a4a4a] transition active:scale-[0.99] hover:border-[#1a1a1a]'>
                  {PERSONALITY_QUIZ[qIndex].optionA.label}
                </button>
                <button type='button' onClick={() => answerQuiz('B')} className='w-full rounded-2xl border border-[#e2ded7] bg-white px-4 py-3 text-left text-sm text-[#4a4a4a] transition active:scale-[0.99] hover:border-[#1a1a1a]'>
                  {PERSONALITY_QUIZ[qIndex].optionB.label}
                </button>
              </div>
            </div>
          )}
        </StepPanel>
      ) : null}

      {/* ナビゲーション */}
      <div className='flex items-center gap-3 pt-2'>
        {step > 1 ? (
          <button
            type='button'
            onClick={() => setStep((s) => s - 1)}
            className='h-12 shrink-0 rounded-full border border-[#d8d6d1] px-5 text-sm font-semibold text-[#6b6b6b]'
          >
            戻る
          </button>
        ) : null}

        {step < TOTAL ? (
          <button
            type='button'
            disabled={!canProceed}
            onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
            className='h-12 flex-1 rounded-full bg-[#1a1a1a] text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-40'
          >
            次へ
          </button>
        ) : (
          <button type='submit' className='h-12 flex-1 rounded-full bg-[#1a1a1a] text-sm font-semibold text-white transition active:scale-[0.99]'>
            プロフィールを登録する
          </button>
        )}
      </div>

      {step === TOTAL && !result ? (
        <button type='submit' className='w-full text-center text-xs text-[#9a9a9a] underline-offset-2 hover:underline'>
          診断をスキップして登録する
        </button>
      ) : null}
    </form>
  );
}

function StepPanel({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <section className='space-y-5'>
      <div>
        <h2 className='text-lg font-semibold text-[#1a1a1a]'>{title}</h2>
        <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{lead}</p>
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

function SelectChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex h-11 items-center justify-center rounded-2xl border px-3 text-xs font-medium transition ${
        active ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#e2ded7] bg-white text-[#4a4a4a]'
      }`}
    >
      {children}
    </button>
  );
}

function TagChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition active:scale-[0.97] ${
        active ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#e2ded7] bg-white text-[#4a4a4a]'
      }`}
    >
      {children}
    </button>
  );
}

function CardChoice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition active:scale-[0.99] ${
        active ? 'border-[#1a1a1a] bg-[#faf3ee] text-[#1a1a1a]' : 'border-[#e2ded7] bg-white text-[#4a4a4a]'
      }`}
    >
      <span>{children}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
          active ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#d8d6d1] text-transparent'
        }`}
      >
        ✓
      </span>
    </button>
  );
}
