'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { saveProfileAction } from '@/lib/connection/actions';
import {
  AGE_BAND_OPTIONS,
  inferAgeBandFromAge,
  SOCIAL_LINK_PLATFORMS,
  type MbtiType,
  type SocialLinkPlatform,
} from '@/lib/connection/bloom-profile-options';
import {
  DESIRED_CONNECTION_OPTIONS,
  EXPERIENCE_OPTIONS,
  EXPERIENCE_TO_INTEREST,
  LIFE_PHASE_MINDSET_OPTIONS,
  OCCUPATION_OPTIONS,
  PREFECTURES,
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
import { BioStep, MbtiStep, SocialLinksStep } from './bloom-profile-steps';
import { BottomNavButtons, OnboardingLayout, ONB, ProgressDots } from './onboarding-ui';
import {
  AreaSelectStep,
  MultiChoiceStep,
  OnboardingStepIntro,
  SingleChoiceStep,
  TextInputStep,
  TextareaStep,
} from './steps';
import { ProfilePhotosStep } from './profile-photos-step';

const GENDER_OPTIONS: Option<'male' | 'female' | 'other'>[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他 / 回答しない' },
];

const VALUE_TAG_MAX = 3;

/** 進捗ドットに含めるステップ数（Welcome を除く設問数）。 */
const QUESTION_COUNT = 18;

function toggle<T>(list: T[], value: T, max?: number): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (typeof max === 'number' && list.length >= max) return list;
  return [...list, value];
}

/** 「次へ」は右からスライドイン・左へフェードアウト、「戻る」は逆方向。 */
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 26 : -26 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -26 : 26, transition: { duration: 0.16, ease: 'easeIn' as const } }),
};

const QUESTION_EXAMPLES: Record<number, string[]> = {
  11: ['新しい習慣', '仕事や学び', '身体づくり', '趣味の探求'],
  12: ['旅行', '新しい趣味', '仕事への挑戦', '人との出会い'],
  13: ['最近読んだ本', '旅先で見た景色', '誰かとの会話', '映画や音楽'],
  14: ['穏やか', '聞き上手', '行動的', '面倒見がいい'],
};

/** ステップごとの水彩イラスト（トップページと共通の世界観）。設問テーマに合わせて対応付け。 */
const STEP_ART: Record<number, string> = {
  1: '/flow/register.png',
  2: '/flow/register.png',
  3: '/flow/register.png',
  4: '/categories/stroll.png',
  5: '/categories/cafe.png',
  6: '/categories/flower.png',
  7: '/categories/stroll.png',
  8: '/categories/fitness.png',
  9: '/flow/matching.png',
  10: '/categories/flower.png',
  11: '/categories/fitness.png',
  12: '/flow/matching.png',
  13: '/categories/cafe.png',
  14: '/categories/bar.png',
  15: '/flow/continue.png',
  16: '/categories/cafe.png',
  17: '/categories/flower.png',
  18: '/onboarding/welcome.png',
};

export function OnboardingFlow({ error, member }: { error?: string; member?: ConnectionMember | null }) {
  const v = member?.values;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [nickname, setNickname] = useState(member?.nickname ?? '');
  const [ageBand, setAgeBand] = useState<string>(
    member?.ageBand || (member?.age ? inferAgeBandFromAge(member.age) : '') || '',
  );
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(member?.gender ?? '');
  const [area, setArea] = useState(member?.area ?? '');
  const [bio, setBio] = useState(member?.bio ?? '');
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialLinkPlatform, string>>>(() => {
    const initial: Partial<Record<SocialLinkPlatform, string>> = {};
    for (const link of member?.socialLinks ?? []) {
      initial[link.platform] = link.url;
    }
    return initial;
  });
  const [mbtiType, setMbtiType] = useState<MbtiType | ''>(member?.mbtiType ?? '');
  const [occupation, setOccupation] = useState<LifePhase | ''>(member?.lifePhase ?? '');
  const [currentPhase, setCurrentPhase] = useState<string>(v?.mostImportant ?? '');
  const [weekend, setWeekend] = useState<InterestTag[]>(
    (member?.interestTags ?? []).filter((t) => WEEKEND_OPTIONS.some((o) => o.value === t)),
  );
  const [experiences, setExperiences] = useState<string[]>(
    EXPERIENCE_OPTIONS.filter((o) => {
      const mapped = EXPERIENCE_TO_INTEREST[o.value];
      return mapped ? (member?.interestTags ?? []).includes(mapped) : false;
    }).map((o) => o.value),
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

  const occupationLabel = OCCUPATION_OPTIONS.find((o) => o.value === occupation)?.label ?? '';

  // 休日(step7) + 興味のある体験(step8) を既存 interestTags キーへ統合（重複排除）
  const interestTagsToSubmit = useMemo(() => {
    const mapped = experiences
      .map((e) => EXPERIENCE_TO_INTEREST[e])
      .filter((t): t is InterestTag => Boolean(t));
    return Array.from(new Set<InterestTag>([...weekend, ...mapped]));
  }, [weekend, experiences]);

  // step 0 = Welcome, step 1..15 = 設問
  const isLast = step === QUESTION_COUNT;

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return nickname.trim().length > 0;
      case 2:
        return ageBand !== '';
      case 3:
        return gender !== '';
      case 4:
        return area !== '';
      default:
        return true;
    }
  }, [step, nickname, ageBand, gender, area]);

  function next() {
    setDirection(1);
    setStep((s) => Math.min(QUESTION_COUNT, s + 1));
  }
  function back() {
    setDirection(-1);
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

  function renderStep() {
    switch (step) {
      case 0:
        return <OnboardingStepIntro />;
      case 1:
        return (
          <TextInputStep
            index={1}
            art={STEP_ART[1]}
            title='あなたの表示名を決めましょう'
            subtitle='あとから変更できます'
            value={nickname}
            onChange={setNickname}
            placeholder='例：Ricky'
            maxLength={20}
          />
        );
      case 2:
        return (
          <SingleChoiceStep
            index={2}
            art={STEP_ART[2]}
            title='あなたの年齢層を教えてください'
            subtitle='必須 · Connection設計の参考にします'
            options={AGE_BAND_OPTIONS}
            value={ageBand as import('@/lib/connection/bloom-profile-options').AgeBand | ''}
            onChange={setAgeBand}
          />
        );
      case 3:
        return (
          <SingleChoiceStep
            index={3}
            art={STEP_ART[3]}
            title='あなたの性別を教えてください'
            subtitle='必須'
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />
        );
      case 4:
        return (
          <AreaSelectStep
            index={4}
            art={STEP_ART[4]}
            title='お住まいの地域を教えてください'
            subtitle='必須 · 近いエリアの体験をご案内する参考にします'
            value={area}
            onChange={setArea}
            options={PREFECTURES}
          />
        );
      case 5:
        return (
          <SingleChoiceStep
            index={5}
            art={STEP_ART[5]}
            title='今のお仕事に近いものを選んでください'
            subtitle='任意 · あとから変更できます'
            options={OCCUPATION_OPTIONS}
            value={occupation}
            onChange={setOccupation}
          />
        );
      case 6:
        return (
          <SingleChoiceStep
            index={6}
            art={STEP_ART[6]}
            title='今のあなたに近いものを選んでください'
            subtitle='任意 · Connectionの組み合わせを考える参考にします'
            options={LIFE_PHASE_MINDSET_OPTIONS}
            value={currentPhase}
            onChange={setCurrentPhase}
          />
        );
      case 7:
        return (
          <MultiChoiceStep
            index={7}
            art={STEP_ART[7]}
            title='趣味・興味：お休みの日は何をしていますか？'
            subtitle={`任意 · 複数選べます${weekend.length > 0 ? `（${weekend.length}つ選択中）` : ''}`}
            options={WEEKEND_OPTIONS}
            values={weekend}
            onToggle={(value) => setWeekend((s) => toggle(s, value))}
            variant='chip'
          />
        );
      case 8:
        return (
          <MultiChoiceStep
            index={8}
            art={STEP_ART[8]}
            title='参加してみたい体験を選んでください'
            subtitle='任意 · HANAKAIでは、体験を通じて自然なConnectionをつくります'
            options={EXPERIENCE_OPTIONS}
            values={experiences}
            onToggle={(value) => setExperiences((s) => toggle(s, value))}
            variant='card'
          />
        );
      case 9:
        return (
          <MultiChoiceStep
            index={9}
            art={STEP_ART[9]}
            title='今、どんなConnectionを求めていますか？'
            subtitle='任意 · 複数選べます'
            options={DESIRED_CONNECTION_OPTIONS}
            values={purposes}
            onToggle={(value) => setPurposes((s) => toggle(s, value))}
            variant='card'
          />
        );
      case 10:
        return (
          <MultiChoiceStep
            index={10}
            art={STEP_ART[10]}
            title='大切にしている価値観を選んでください'
            subtitle={`任意 · 3つまで選べます${valueTags.length > 0 ? `（${valueTags.length}/${VALUE_TAG_MAX}）` : ''}`}
            options={VALUE_TAG_ONBOARDING_OPTIONS}
            values={valueTags}
            onToggle={(value) => setValueTags((s) => toggle(s, value, VALUE_TAG_MAX))}
            variant='chip'
            max={VALUE_TAG_MAX}
          />
        );
      case 11:
        return (
          <TextareaStep
            index={11}
            art={STEP_ART[11]}
            title='最近、挑戦していることはありますか？'
            subtitle='小さなことでも構いません'
            value={currentChallenge}
            onChange={setCurrentChallenge}
            placeholder='例：朝の時間を大切にする習慣をつくっています'
            examples={QUESTION_EXAMPLES[11]}
          />
        );
      case 12:
        return (
          <TextareaStep
            index={12}
            art={STEP_ART[12]}
            title='これからやってみたいことはありますか？'
            value={futureGoal}
            onChange={setFutureGoal}
            placeholder='例：もう少し自然に触れる時間を増やしたい'
            examples={QUESTION_EXAMPLES[12]}
          />
        );
      case 13:
        return (
          <TextareaStep
            index={13}
            art={STEP_ART[13]}
            title='最近、心が動いたことを教えてください'
            subtitle='感動したこと、考えさせられたこと、印象に残ったことなど'
            value={recentInspiration}
            onChange={setRecentInspiration}
            placeholder='例：ふと立ち寄った展示で、静かな時間を過ごせました'
            examples={QUESTION_EXAMPLES[13]}
          />
        );
      case 14:
        return (
          <TextareaStep
            index={14}
            art={STEP_ART[14]}
            title='周りからどんな人だと言われますか？'
            value={howOthersSeeMe}
            onChange={setHowOthersSeeMe}
            placeholder='例：穏やかで聞き上手、とよく言われます'
            examples={QUESTION_EXAMPLES[14]}
          />
        );
      case 15:
        return <BioStep index={15} art={STEP_ART[15]} value={bio} onChange={setBio} />;
      case 16:
        return (
          <SocialLinksStep
            index={16}
            art={STEP_ART[16]}
            values={socialLinks}
            onChange={(platform, url) => setSocialLinks((prev) => ({ ...prev, [platform]: url }))}
          />
        );
      case 17:
        return (
          <MbtiStep
            index={17}
            art={STEP_ART[17]}
            value={mbtiType}
            onChange={setMbtiType}
          />
        );
      case 18:
        return (
          <ProfilePhotosStep index={18} art={STEP_ART[18]} initialPhotos={member?.photos} />
        );
      default:
        return null;
    }
  }

  return (
    <form action={saveProfileAction}>
      {/* 送信用の隠しフィールド（常時マウント） */}
      <input type='hidden' name='nickname' value={nickname} />
      <input type='hidden' name='ageBand' value={ageBand} />
      <input type='hidden' name='gender' value={gender || ''} />
      <input type='hidden' name='area' value={area} />
      <input type='hidden' name='bio' value={bio} />
      <input type='hidden' name='mbtiType' value={mbtiType} />
      {SOCIAL_LINK_PLATFORMS.map(({ platform }) => (
        <input
          key={platform}
          type='hidden'
          name={`socialLink_${platform}`}
          value={socialLinks[platform] ?? ''}
        />
      ))}
      <input type='hidden' name='lifePhase' value={occupation || 'other'} />
      <input type='hidden' name='occupation' value={occupationLabel} />
      <input type='hidden' name='mostImportant' value={currentPhase} />
      <input type='hidden' name='currentChallenge' value={currentChallenge} />
      <input type='hidden' name='futureGoal' value={futureGoal} />
      <input type='hidden' name='recentInspiration' value={recentInspiration} />
      <input type='hidden' name='howOthersSeeMe' value={howOthersSeeMe} />
      {interestTagsToSubmit.map((t) => (
        <input key={t} type='hidden' name='interestTags' value={t} />
      ))}
      {purposes.map((p) => (
        <input key={p} type='hidden' name='purposes' value={p} />
      ))}
      {valueTags.map((t) => (
        <input key={t} type='hidden' name='valueTags' value={t} />
      ))}

      <OnboardingLayout header={header} footer={footer}>
        {error === 'nickname' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            表示名を入力してください。
          </p>
        ) : null}
        {error === 'gender' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            性別を選択してください。
          </p>
        ) : null}
        {error === 'area' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            お住まいの地域を選択してください。
          </p>
        ) : null}
        {error === 'ageBand' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            年齢層を選択してください。
          </p>
        ) : null}

        <AnimatePresence mode='wait' initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial='enter'
            animate='center'
            exit='exit'
            className='flex flex-1 flex-col'
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </OnboardingLayout>
    </form>
  );
}
