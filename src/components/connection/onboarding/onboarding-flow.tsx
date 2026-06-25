'use client';

import { useMemo, useState } from 'react';
import { saveProfileAction } from '@/lib/connection/actions';
import {
  DESIRED_CONNECTION_OPTIONS,
  EXPERIENCE_OPTIONS,
  LIFE_PHASE_MINDSET_OPTIONS,
  OCCUPATION_OPTIONS,
  PREFECTURES,
  TEMPERAMENT_OPTIONS,
  VALUE_TAG_ONBOARDING_OPTIONS,
  WEEKEND_OPTIONS,
  type Option,
} from '@/lib/connection/onboarding-options';
import type {
  ConnectionMember,
  ConnectionPurpose,
  InterestTag,
  LifePhase,
  ValueTag,
} from '@/lib/connection/types';
import { BottomNavButtons, OnboardingLayout, ONB, ProgressDots } from './onboarding-ui';
import {
  AreaSelectStep,
  MultiChoiceStep,
  OnboardingStepIntro,
  SingleChoiceStep,
  TextInputStep,
  TextareaStep,
} from './steps';

const GENDER_OPTIONS: Option<'male' | 'female' | 'other'>[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他 / 回答しない' },
];

const VALUE_TAG_MAX = 3;
const WEEKEND_MIN = 2;

/** 進捗ドットに含めるステップ数（Welcome を除く設問数）。 */
const QUESTION_COUNT = 15;

function toggle<T>(list: T[], value: T, max?: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (typeof max === 'number' && list.length >= max) return list;
  return [...list, value];
}

export function OnboardingFlow({ error, member }: { error?: string; member?: ConnectionMember | null }) {
  const v = member?.values;

  const [step, setStep] = useState(0);

  const [nickname, setNickname] = useState(member?.nickname ?? '');
  const [age, setAge] = useState(member?.age ? String(member.age) : '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(member?.gender ?? '');
  const [area, setArea] = useState(member?.area ?? '');
  const [occupation, setOccupation] = useState<LifePhase | ''>(member?.lifePhase ?? '');
  const [currentPhase, setCurrentPhase] = useState<string>(v?.currentPhase ?? '');
  const [weekend, setWeekend] = useState<InterestTag[]>(
    (member?.interestTags ?? []).filter((t) => WEEKEND_OPTIONS.some((o) => o.value === t)),
  );
  const [experiences, setExperiences] = useState<string[]>(
    (v?.experiences ?? []).filter((e) => EXPERIENCE_OPTIONS.some((o) => o.value === e)),
  );
  const [purposes, setPurposes] = useState<ConnectionPurpose[]>(
    (member?.purposes ?? []).filter((p) => DESIRED_CONNECTION_OPTIONS.some((o) => o.value === p)),
  );
  const [valueTags, setValueTags] = useState<ValueTag[]>(
    (v?.valueTags ?? []).filter((t) => VALUE_TAG_ONBOARDING_OPTIONS.some((o) => o.value === t)).slice(0, VALUE_TAG_MAX),
  );
  const [currentChallenge, setCurrentChallenge] = useState(v?.currentChallenge ?? '');
  const [futureGoal, setFutureGoal] = useState(v?.futureGoal ?? '');
  const [recentInspiration, setRecentInspiration] = useState(v?.recentInspiration ?? '');
  const [howOthersSeeMe, setHowOthersSeeMe] = useState(v?.howOthersSeeMe ?? '');
  const [temperament, setTemperament] = useState<string>('');

  const ageNum = Number(age);
  const ageValid = age.trim().length > 0 && ageNum >= 18 && ageNum <= 119;

  const occupationLabel = OCCUPATION_OPTIONS.find((o) => o.value === occupation)?.label ?? '';
  const selectedTemperament = TEMPERAMENT_OPTIONS.find((t) => t.value === temperament) ?? null;

  // step 0 = Welcome, step 1..15 = 設問
  const isLast = step === QUESTION_COUNT;

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return nickname.trim().length > 0;
      case 2:
        return ageValid;
      case 3:
        return gender !== '';
      case 4:
        return area !== '';
      case 5:
        return occupation !== '';
      case 6:
        return currentPhase !== '';
      case 7:
        return weekend.length >= WEEKEND_MIN;
      case 8:
        return experiences.length >= 1;
      case 9:
        return purposes.length >= 1;
      case 10:
        return valueTags.length >= 1;
      case 11:
      case 12:
      case 13:
      case 14:
        return true; // 深掘り質問は任意
      case 15:
        return temperament !== '';
      default:
        return false;
    }
  }, [step, nickname, ageValid, gender, area, occupation, currentPhase, weekend, experiences, purposes, valueTags, temperament]);

  function next() {
    setStep((s) => Math.min(QUESTION_COUNT, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const header =
    step === 0 ? (
      <div className='space-y-4'>
        <div className='flex flex-col'>
          <span className='text-[14px] font-semibold tracking-[0.14em]' style={{ color: ONB.ink }}>
            HANAKAI
          </span>
          <span className='text-[10px] font-medium tracking-[0.24em]' style={{ color: ONB.subtle }}>
            CONNECTION
          </span>
        </div>
        <ProgressDots total={QUESTION_COUNT} current={-1} />
      </div>
    ) : (
      <ProgressDots total={QUESTION_COUNT} current={step - 1} />
    );

  const footer =
    step === 0 ? (
      <BottomNavButtons onNext={next} nextLabel='はじめる' />
    ) : (
      <BottomNavButtons
        onBack={back}
        onNext={isLast ? undefined : next}
        nextLabel={isLast ? '登録する' : '次へ'}
        nextDisabled={!canProceed}
        nextType={isLast ? 'submit' : 'button'}
      />
    );

  return (
    <form action={saveProfileAction}>
      {/* 送信用の隠しフィールド（常時マウント） */}
      <input type='hidden' name='nickname' value={nickname} />
      <input type='hidden' name='age' value={age} />
      <input type='hidden' name='gender' value={gender || 'other'} />
      <input type='hidden' name='area' value={area} />
      <input type='hidden' name='lifePhase' value={occupation || 'other'} />
      <input type='hidden' name='occupation' value={occupationLabel} />
      <input type='hidden' name='currentPhase' value={currentPhase} />
      <input type='hidden' name='currentChallenge' value={currentChallenge} />
      <input type='hidden' name='futureGoal' value={futureGoal} />
      <input type='hidden' name='recentInspiration' value={recentInspiration} />
      <input type='hidden' name='howOthersSeeMe' value={howOthersSeeMe} />
      {weekend.map((t) => (
        <input key={t} type='hidden' name='interestTags' value={t} />
      ))}
      {experiences.map((e) => (
        <input key={e} type='hidden' name='experiences' value={e} />
      ))}
      {purposes.map((p) => (
        <input key={p} type='hidden' name='purposes' value={p} />
      ))}
      {valueTags.map((t) => (
        <input key={t} type='hidden' name='valueTags' value={t} />
      ))}
      {selectedTemperament ? (
        <>
          <input type='hidden' name='personalityType' value={selectedTemperament.type} />
          <input type='hidden' name='personalityEnergy' value={selectedTemperament.axes.energy} />
          <input type='hidden' name='personalityThinking' value={selectedTemperament.axes.thinking} />
          <input type='hidden' name='personalityPlanning' value={selectedTemperament.axes.planning} />
        </>
      ) : null}

      <OnboardingLayout header={header} footer={footer}>
        {error === 'nickname' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            表示名を入力してください。
          </p>
        ) : null}

        {step === 0 ? <OnboardingStepIntro /> : null}

        {step === 1 ? (
          <TextInputStep
            index={1}
            title='あなたの表示名を決めましょう'
            subtitle='あとから変更できます'
            value={nickname}
            onChange={setNickname}
            placeholder='例：Ricky'
            maxLength={20}
          />
        ) : null}

        {step === 2 ? (
          <TextInputStep
            index={2}
            title='あなたの年齢を教えてください'
            subtitle='Connection設計の参考にします。正確に入力してください。'
            value={age}
            onChange={setAge}
            placeholder='32'
            inputMode='numeric'
            suffix='歳'
            maxLength={3}
          />
        ) : null}

        {step === 3 ? (
          <SingleChoiceStep
            index={3}
            title='あなたの性別を教えてください'
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />
        ) : null}

        {step === 4 ? (
          <AreaSelectStep
            index={4}
            title='お住まいの地域を教えてください'
            subtitle='近いエリアの体験をご案内する参考にします'
            value={area}
            onChange={setArea}
            options={PREFECTURES}
          />
        ) : null}

        {step === 5 ? (
          <SingleChoiceStep
            index={5}
            title='今のお仕事に近いものを選んでください'
            options={OCCUPATION_OPTIONS}
            value={occupation}
            onChange={setOccupation}
          />
        ) : null}

        {step === 6 ? (
          <SingleChoiceStep
            index={6}
            title='今のあなたに近いものを選んでください'
            subtitle='Connectionの組み合わせを考える参考にします'
            options={LIFE_PHASE_MINDSET_OPTIONS}
            value={currentPhase}
            onChange={setCurrentPhase}
          />
        ) : null}

        {step === 7 ? (
          <MultiChoiceStep
            index={7}
            title='お休みの日は何をしていますか？'
            subtitle={`まずは2つ選んでみましょう${weekend.length > 0 ? `（${weekend.length}つ選択中）` : ''}`}
            options={WEEKEND_OPTIONS}
            values={weekend}
            onToggle={(value) => setWeekend((s) => toggle(s, value))}
            variant='chip'
          />
        ) : null}

        {step === 8 ? (
          <MultiChoiceStep
            index={8}
            title='参加してみたい体験を選んでください'
            subtitle='HANAKAIでは、体験を通じて自然なConnectionをつくります'
            options={EXPERIENCE_OPTIONS}
            values={experiences}
            onToggle={(value) => setExperiences((s) => toggle(s, value))}
            variant='card'
          />
        ) : null}

        {step === 9 ? (
          <MultiChoiceStep
            index={9}
            title='今、どんなConnectionを求めていますか？'
            subtitle='複数選べます'
            options={DESIRED_CONNECTION_OPTIONS}
            values={purposes}
            onToggle={(value) => setPurposes((s) => toggle(s, value))}
            variant='card'
          />
        ) : null}

        {step === 10 ? (
          <MultiChoiceStep
            index={10}
            title='大切にしている価値観を選んでください'
            subtitle={`3つまで選べます${valueTags.length > 0 ? `（${valueTags.length}/${VALUE_TAG_MAX}）` : ''}`}
            options={VALUE_TAG_ONBOARDING_OPTIONS}
            values={valueTags}
            onToggle={(value) => setValueTags((s) => toggle(s, value, VALUE_TAG_MAX))}
            variant='chip'
            max={VALUE_TAG_MAX}
          />
        ) : null}

        {step === 11 ? (
          <TextareaStep
            index={11}
            title='最近、挑戦していることはありますか？'
            subtitle='小さなことでも構いません'
            value={currentChallenge}
            onChange={setCurrentChallenge}
            placeholder='例：朝の時間を大切にする習慣をつくっています'
          />
        ) : null}

        {step === 12 ? (
          <TextareaStep
            index={12}
            title='これからやってみたいことはありますか？'
            value={futureGoal}
            onChange={setFutureGoal}
            placeholder='例：もう少し自然に触れる時間を増やしたい'
          />
        ) : null}

        {step === 13 ? (
          <TextareaStep
            index={13}
            title='最近、心が動いたことを教えてください'
            subtitle='感動したこと、考えさせられたこと、印象に残ったことなど'
            value={recentInspiration}
            onChange={setRecentInspiration}
            placeholder='例：ふと立ち寄った展示で、静かな時間を過ごせました'
          />
        ) : null}

        {step === 14 ? (
          <TextareaStep
            index={14}
            title='周りからどんな人だと言われますか？'
            value={howOthersSeeMe}
            onChange={setHowOthersSeeMe}
            placeholder='例：穏やかで聞き上手、とよく言われます'
          />
        ) : null}

        {step === 15 ? (
          <SingleChoiceStep
            index={15}
            title='あなたに近い雰囲気を選んでください'
            subtitle='評価のためではなく、相互理解のための参考にします'
            options={TEMPERAMENT_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            value={temperament}
            onChange={setTemperament}
          />
        ) : null}
      </OnboardingLayout>
    </form>
  );
}
