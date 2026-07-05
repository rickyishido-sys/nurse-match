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
  PREFECTURES,
  WEEKEND_OPTIONS,
  type Option,
} from '@/lib/connection/onboarding-options';
import type {
  ConnectionMember,
  ConnectionPurpose,
  InterestTag,
} from '@/lib/connection/types';
import { BioStep, MbtiStep, SocialLinksStep } from './bloom-profile-steps';
import { IdentityDocumentStep, PasswordStep } from './registration-steps';
import { BottomNavButtons, OnboardingLayout, ONB, ProgressDots } from './onboarding-ui';
import {
  AreaSelectStep,
  MultiChoiceStep,
  OnboardingStepIntro,
  SingleChoiceStep,
  TextInputStep,
} from './steps';

const GENDER_OPTIONS: Option<'male' | 'female' | 'other'>[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他 / 回答しない' },
];

/** Welcome を除く設問数 */
const QUESTION_COUNT = 11;

function toggle<T>(list: T[], value: T): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 26 : -26 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -26 : 26, transition: { duration: 0.16, ease: 'easeIn' as const } }),
};

const STEP_ART: Record<number, string> = {
  1: '/flow/register.png',
  2: '/flow/register.png',
  3: '/flow/register.png',
  4: '/flow/register.png',
  5: '/categories/stroll.png',
  6: '/categories/cafe.png',
  7: '/categories/flower.png',
  8: '/categories/cafe.png',
  9: '/categories/flower.png',
  10: '/categories/fitness.png',
  11: '/flow/matching.png',
};

export function OnboardingFlow({ error, member }: { error?: string; member?: ConnectionMember | null }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [passwordSet, setPasswordSet] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const identityFileName = identityFile?.name ?? '';

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
  const [weekend, setWeekend] = useState<InterestTag[]>(
    (member?.interestTags ?? []).filter((t) => WEEKEND_OPTIONS.some((o) => o.value === t)),
  );
  const [purposes, setPurposes] = useState<ConnectionPurpose[]>(
    (member?.purposes ?? []).filter((p) => DESIRED_CONNECTION_OPTIONS.some((o) => o.value === p)),
  );

  const isLast = step === QUESTION_COUNT;
  const isPasswordStep = step === 1;

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return passwordSet;
      case 2:
        return nickname.trim().length > 0;
      case 3:
        return gender !== '';
      case 4:
        return ageBand !== '';
      case 5:
        return area !== '';
      case 6:
        return identityFileName.length > 0;
      default:
        return true;
    }
  }, [step, passwordSet, nickname, gender, ageBand, area, identityFileName]);

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
    ) : isPasswordStep ? null : (
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
          <PasswordStep
            index={1}
            art={STEP_ART[1]}
            onComplete={() => {
              setPasswordSet(true);
              next();
            }}
          />
        );
      case 2:
        return (
          <TextInputStep
            index={2}
            art={STEP_ART[2]}
            title='あなたの表示名を決めましょう'
            subtitle='必須 · あとから変更できます'
            value={nickname}
            onChange={setNickname}
            placeholder='例：Ricky'
            maxLength={20}
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
          <SingleChoiceStep
            index={4}
            art={STEP_ART[4]}
            title='あなたの年齢層を教えてください'
            subtitle='必須 · Connection設計の参考にします'
            options={AGE_BAND_OPTIONS}
            value={ageBand as import('@/lib/connection/bloom-profile-options').AgeBand | ''}
            onChange={setAgeBand}
          />
        );
      case 5:
        return (
          <AreaSelectStep
            index={5}
            art={STEP_ART[5]}
            title='お住まいの地域を教えてください'
            subtitle='必須 · 近いエリアの体験をご案内する参考にします'
            value={area}
            onChange={setArea}
            options={PREFECTURES}
          />
        );
      case 6:
        return (
          <IdentityDocumentStep
            index={6}
            art={STEP_ART[6]}
            fileName={identityFileName}
            onFileChange={setIdentityFile}
          />
        );
      case 7:
        return <BioStep index={7} art={STEP_ART[7]} value={bio} onChange={setBio} />;
      case 8:
        return (
          <SocialLinksStep
            index={8}
            art={STEP_ART[8]}
            values={socialLinks}
            onChange={(platform, url) => setSocialLinks((prev) => ({ ...prev, [platform]: url }))}
          />
        );
      case 9:
        return <MbtiStep index={9} art={STEP_ART[9]} value={mbtiType} onChange={setMbtiType} />;
      case 10:
        return (
          <MultiChoiceStep
            index={10}
            art={STEP_ART[10]}
            title='趣味・興味：お休みの日は何をしていますか？'
            subtitle={`任意 · 複数選べます${weekend.length > 0 ? `（${weekend.length}つ選択中）` : ''}`}
            options={WEEKEND_OPTIONS}
            values={weekend}
            onToggle={(value) => setWeekend((s) => toggle(s, value))}
            variant='chip'
          />
        );
      case 11:
        return (
          <MultiChoiceStep
            index={11}
            art={STEP_ART[11]}
            title='今、どんなConnectionを求めていますか？'
            subtitle='任意 · 複数選べます'
            options={DESIRED_CONNECTION_OPTIONS}
            values={purposes}
            onToggle={(value) => setPurposes((s) => toggle(s, value))}
            variant='card'
          />
        );
      default:
        return null;
    }
  }

  return (
    <form
      action={async (formData) => {
        if (identityFile) formData.set('identityDocument', identityFile);
        await saveProfileAction(formData);
      }}
    >
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
      <input type='hidden' name='lifePhase' value='other' />
      {weekend.map((t) => (
        <input key={t} type='hidden' name='interestTags' value={t} />
      ))}
      {purposes.map((p) => (
        <input key={p} type='hidden' name='purposes' value={p} />
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
        {error === 'identity' || error === 'identity-upload' ? (
          <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
            本人確認書類をアップロードしてください。
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
