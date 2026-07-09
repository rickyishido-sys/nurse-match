'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
  nextStepId,
  persistOnboardingStarted,
  persistOnboardingStep,
  prevStepId,
  progressDotIndex,
  QUESTION_STEP_IDS,
  resolveInitialOnboardingStep,
  type OnboardingStepId,
} from '@/lib/connection/onboarding-progress';
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

function initialDisplayNickname(member?: ConnectionMember | null): string {
  const nickname = member?.nickname?.trim() ?? '';
  if (!nickname) return '';
  const profileStarted =
    member?.gender === 'male' ||
    member?.gender === 'female' ||
    member?.gender === 'other' ||
    Boolean(member?.area?.trim()) ||
    Boolean(member?.ageBand);
  return profileStarted ? nickname : '';
}

function toggle<T>(list: T[], value: T): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 26 : -26 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -26 : 26, transition: { duration: 0.16, ease: 'easeIn' as const } }),
};

const STEP_ART: Partial<Record<OnboardingStepId, string>> = {
  password: '/flow/register.png',
  nickname: '/flow/register.png',
  gender: '/flow/register.png',
  ageBand: '/flow/register.png',
  area: '/categories/stroll.png',
  identity: '/categories/cafe.png',
  bio: '/categories/flower.png',
  sns: '/categories/cafe.png',
  mbti: '/categories/flower.png',
  interests: '/categories/fitness.png',
  purposes: '/flow/matching.png',
};

function stepDisplayIndex(step: OnboardingStepId): number {
  return progressDotIndex(step) + 1;
}

export function OnboardingFlow({
  error,
  member,
  hasPasswordSet = false,
}: {
  error?: string;
  member?: ConnectionMember | null;
  hasPasswordSet?: boolean;
}) {
  const [step, setStep] = useState<OnboardingStepId>('intro');
  const [direction, setDirection] = useState(1);
  const [ready, setReady] = useState(false);
  const [passwordDone, setPasswordDone] = useState(hasPasswordSet);
  const [submitting, startSubmit] = useTransition();
  const initLogged = useRef(false);
  const initDone = useRef(false);

  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const identityFileName = identityFile?.name ?? '';

  const [nickname, setNickname] = useState(() => initialDisplayNickname(member));
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

  const skipPassword = passwordDone || hasPasswordSet;

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    try {
      const initial = resolveInitialOnboardingStep(member, hasPasswordSet);
      if (!initLogged.current) {
        console.log('BLOOM_ONBOARDING_INIT', {
          initial,
          hasPasswordSet,
          error: error ?? null,
        });
        initLogged.current = true;
      }
      setStep(initial);
      if (hasPasswordSet) setPasswordDone(true);
      setReady(true);
    } catch (initError) {
      console.error('BLOOM_ONBOARDING_INIT_ERROR', initError);
      try {
        sessionStorage.removeItem('hanakai_onboarding_started');
        sessionStorage.removeItem('hanakai_onboarding_step');
      } catch {
        // noop
      }
      setStep('intro');
      setReady(true);
    }
  }, [member, hasPasswordSet, error]);

  useEffect(() => {
    if (!ready) return;
    if (step === 'intro') return;
    persistOnboardingStep(step);
  }, [step, ready]);

  useEffect(() => {
    if (!ready) return;
    if (step === 'intro' && (passwordDone || hasPasswordSet)) {
      console.error('BLOOM_ONBOARDING_UNEXPECTED_INTRO_RETURN', { passwordDone, hasPasswordSet });
      setStep('nickname');
    }
  }, [step, ready, passwordDone, hasPasswordSet]);

  const isLast = step === 'purposes';
  const isPasswordStep = step === 'password';

  const canProceed = useMemo(() => {
    switch (step) {
      case 'intro':
        return true;
      case 'password':
        return passwordDone;
      case 'nickname':
        return nickname.trim().length > 0;
      case 'gender':
        return gender !== '';
      case 'ageBand':
        return ageBand !== '';
      case 'area':
        return area !== '';
      case 'identity':
        return true;
      default:
        return true;
    }
  }, [step, passwordDone, nickname, gender, ageBand, area]);

  function goTo(next: OnboardingStepId) {
    setStep(next);
    if (next !== 'intro') persistOnboardingStep(next);
  }

  function handleStart() {
    console.log('BLOOM_ONBOARDING_STARTED');
    const first: OnboardingStepId = skipPassword ? 'nickname' : 'password';
    persistOnboardingStarted(first);
    setDirection(1);
    goTo(first);
  }

  function handleNext() {
    const next = nextStepId(step, skipPassword);
    if (!next) return;
    setDirection(1);
    goTo(next);
  }

  function handleBack() {
    const prev = prevStepId(step, skipPassword);
    if (!prev) return;
    setDirection(-1);
    goTo(prev);
  }

  function handlePasswordComplete() {
    setPasswordDone(true);
    console.log('BLOOM_ONBOARDING_MOVE_TO_NICKNAME');
    persistOnboardingStep('nickname');
    setDirection(1);
    goTo('nickname');
  }

  function handleFinalSubmit() {
    startSubmit(async () => {
      const formData = new FormData();
      formData.set('nickname', nickname);
      formData.set('ageBand', ageBand);
      formData.set('gender', gender || '');
      formData.set('area', area);
      formData.set('bio', bio);
      formData.set('mbtiType', mbtiType);
      formData.set('lifePhase', 'other');
      for (const { platform } of SOCIAL_LINK_PLATFORMS) {
        formData.set(`socialLink_${platform}`, socialLinks[platform] ?? '');
      }
      for (const t of weekend) formData.append('interestTags', t);
      for (const p of purposes) formData.append('purposes', p);
      if (identityFile) formData.set('identityDocument', identityFile);
      await saveProfileAction(formData);
    });
  }

  const header =
    step === 'intro' ? (
      <div className='space-y-4'>
        <div className='flex flex-col'>
          <span className='text-[14px] font-semibold tracking-[0.14em]' style={{ color: ONB.ink }}>
            HANAKAI
          </span>
          <span className='text-[10px] font-medium tracking-[0.24em]' style={{ color: ONB.subtle }}>
            CONNECTION
          </span>
        </div>
        <ProgressDots total={QUESTION_STEP_IDS.length} current={-1} />
      </div>
    ) : (
      <ProgressDots total={QUESTION_STEP_IDS.length} current={progressDotIndex(step)} />
    );

  const footer =
    step === 'intro' ? (
      <BottomNavButtons onNext={handleStart} nextLabel='はじめる' />
    ) : isPasswordStep ? null : (
      <BottomNavButtons
        onBack={handleBack}
        onNext={isLast ? handleFinalSubmit : handleNext}
        nextLabel={isLast ? (submitting ? '保存中…' : '登録する') : '次へ'}
        nextDisabled={isLast ? submitting : !canProceed}
        nextType='button'
      />
    );

  function renderStep() {
    switch (step) {
      case 'intro':
        return <OnboardingStepIntro />;
      case 'password':
        return (
          <PasswordStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.password}
            onComplete={handlePasswordComplete}
          />
        );
      case 'nickname':
        return (
          <TextInputStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.nickname}
            title='あなたの表示名を決めましょう'
            subtitle='必須 · あとから変更できます'
            value={nickname}
            onChange={setNickname}
            placeholder='例：Ricky'
            maxLength={20}
          />
        );
      case 'gender':
        return (
          <SingleChoiceStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.gender}
            title='あなたの性別を教えてください'
            subtitle='必須'
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />
        );
      case 'ageBand':
        return (
          <SingleChoiceStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.ageBand}
            title='あなたの年齢層を教えてください'
            subtitle='必須 · Connection設計の参考にします'
            options={AGE_BAND_OPTIONS}
            value={ageBand as import('@/lib/connection/bloom-profile-options').AgeBand | ''}
            onChange={setAgeBand}
          />
        );
      case 'area':
        return (
          <AreaSelectStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.area}
            title='お住まいの地域を教えてください'
            subtitle='必須 · 近いエリアの体験をご案内する参考にします'
            value={area}
            onChange={setArea}
            options={PREFECTURES}
          />
        );
      case 'identity':
        return (
          <IdentityDocumentStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.identity}
            fileName={identityFileName}
            onFileChange={setIdentityFile}
          />
        );
      case 'bio':
        return <BioStep index={stepDisplayIndex(step)} art={STEP_ART.bio} value={bio} onChange={setBio} />;
      case 'sns':
        return (
          <SocialLinksStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.sns}
            values={socialLinks}
            onChange={(platform, url) => setSocialLinks((prev) => ({ ...prev, [platform]: url }))}
          />
        );
      case 'mbti':
        return (
          <MbtiStep index={stepDisplayIndex(step)} art={STEP_ART.mbti} value={mbtiType} onChange={setMbtiType} />
        );
      case 'interests':
        return (
          <MultiChoiceStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.interests}
            title='趣味・興味：お休みの日は何をしていますか？'
            subtitle={`任意 · 複数選べます${weekend.length > 0 ? `（${weekend.length}つ選択中）` : ''}`}
            options={WEEKEND_OPTIONS}
            values={weekend}
            onToggle={(value) => setWeekend((s) => toggle(s, value))}
            variant='chip'
          />
        );
      case 'purposes':
        return (
          <MultiChoiceStep
            index={stepDisplayIndex(step)}
            art={STEP_ART.purposes}
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

  if (!ready) {
    return (
      <main className='flex min-h-[50vh] items-center justify-center'>
        <p className='text-sm text-[#6b6b6b]'>読み込み中…</p>
      </main>
    );
  }

  return (
    <div>
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
    </div>
  );
}
