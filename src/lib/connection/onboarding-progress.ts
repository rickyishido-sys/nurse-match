import type { ConnectionMember } from '@/lib/connection/types';
import { hasRecordedLegalConsent } from '@/lib/connection/legal-consent';

export type OnboardingStepId =
  | 'intro'
  | 'legal'
  | 'password'
  | 'nickname'
  | 'gender'
  | 'ageBand'
  | 'area'
  | 'identity'
  | 'bio'
  | 'sns'
  | 'mbti'
  | 'interests'
  | 'purposes';

export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  'intro',
  'legal',
  'password',
  'nickname',
  'gender',
  'ageBand',
  'area',
  'identity',
  'bio',
  'sns',
  'mbti',
  'interests',
  'purposes',
];

export const QUESTION_STEP_IDS = ONBOARDING_STEP_ORDER.filter((s) => s !== 'intro') as Exclude<
  OnboardingStepId,
  'intro'
>[];

export const STORAGE_STARTED = 'hanakai_onboarding_started';
export const STORAGE_STEP = 'hanakai_onboarding_step';

export type OnboardingSkipOptions = {
  skipLegal?: boolean;
  skipPassword?: boolean;
};

function isStepId(value: string | null): value is OnboardingStepId {
  return Boolean(value && ONBOARDING_STEP_ORDER.includes(value as OnboardingStepId));
}

function shouldSkipStep(step: OnboardingStepId, options: OnboardingSkipOptions): boolean {
  if (options.skipLegal && step === 'legal') return true;
  if (options.skipPassword && step === 'password') return true;
  return false;
}

export function readOnboardingStarted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_STARTED) === 'true';
  } catch {
    return false;
  }
}

export function readStoredOnboardingStep(): OnboardingStepId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_STEP);
    return isStepId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function persistOnboardingStarted(step: OnboardingStepId) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_STARTED, 'true');
    if (step !== 'intro') {
      sessionStorage.setItem(STORAGE_STEP, step);
    }
  } catch {
    // noop
  }
}

export function persistOnboardingStep(step: OnboardingStepId) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_STARTED, 'true');
    if (step === 'intro') return;
    sessionStorage.setItem(STORAGE_STEP, step);
  } catch {
    // noop
  }
}

export function clearOnboardingProgress() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_STARTED);
    sessionStorage.removeItem(STORAGE_STEP);
  } catch {
    // noop
  }
}

function hasNickname(member: ConnectionMember | null | undefined) {
  return Boolean(member?.nickname?.trim());
}

function hasGender(member: ConnectionMember | null | undefined) {
  return member?.gender === 'male' || member?.gender === 'female' || member?.gender === 'other';
}

function hasAgeBand(member: ConnectionMember | null | undefined) {
  return Boolean(member?.ageBand) || (member?.age ?? 0) >= 18;
}

function hasArea(member: ConnectionMember | null | undefined) {
  return Boolean(member?.area?.trim());
}

export function resolveOnboardingSkipOptions(
  member: ConnectionMember | null | undefined,
  hasPasswordSet: boolean,
): OnboardingSkipOptions {
  return {
    skipLegal: hasRecordedLegalConsent(member),
    skipPassword: hasPasswordSet,
  };
}

/** サーバー側の既存データから最初の未完了ステップを推定 */
export function inferResumeStep(
  member: ConnectionMember | null | undefined,
  hasPasswordSet: boolean,
): OnboardingStepId {
  const skip = resolveOnboardingSkipOptions(member, hasPasswordSet);
  if (!skip.skipLegal) return 'legal';
  if (!hasPasswordSet) return 'password';
  if (!hasNickname(member)) return 'nickname';
  if (!hasGender(member)) return 'gender';
  if (!hasAgeBand(member)) return 'ageBand';
  if (!hasArea(member)) return 'area';
  return 'identity';
}

/** クライアント初期化時のステップ決定 */
export function resolveInitialOnboardingStep(
  member: ConnectionMember | null | undefined,
  hasPasswordSet: boolean,
): OnboardingStepId {
  const skip = resolveOnboardingSkipOptions(member, hasPasswordSet);
  const started = readOnboardingStarted();
  const stored = readStoredOnboardingStep();

  if (started && stored && stored !== 'intro') {
    if (shouldSkipStep(stored, skip) && stored === 'password') {
      persistOnboardingStep('nickname');
      return 'nickname';
    }
    if (shouldSkipStep(stored, skip) && stored === 'legal') {
      const resume = hasPasswordSet ? 'nickname' : 'password';
      persistOnboardingStep(resume);
      return resume;
    }
    if (!hasPasswordSet && stored !== 'password' && stored !== 'legal') {
      clearOnboardingProgress();
      return 'intro';
    }
    if (hasPasswordSet && stored === 'password') {
      persistOnboardingStep('nickname');
      return 'nickname';
    }
    console.log('BLOOM_ONBOARDING_RESTORE_STEP', { stored, started });
    return stored;
  }

  if (started) {
    const resume = inferResumeStep(member, hasPasswordSet);
    console.log('BLOOM_ONBOARDING_RESTORE_STEP', { stored: resume, started, reason: 'started_without_step' });
    return resume;
  }

  return 'intro';
}

export function stepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEP_ORDER.indexOf(step);
}

export function nextStepId(current: OnboardingStepId, options: OnboardingSkipOptions): OnboardingStepId | null {
  let idx = stepIndex(current);
  if (idx < 0 || idx >= ONBOARDING_STEP_ORDER.length - 1) return null;
  let next = ONBOARDING_STEP_ORDER[idx + 1];
  while (next && shouldSkipStep(next, options)) {
    idx += 1;
    next = ONBOARDING_STEP_ORDER[idx + 1] ?? null;
  }
  return next;
}

export function prevStepId(current: OnboardingStepId, options: OnboardingSkipOptions): OnboardingStepId | null {
  let idx = stepIndex(current);
  if (idx <= 0) return null;
  let prev = ONBOARDING_STEP_ORDER[idx - 1];
  while (prev && shouldSkipStep(prev, options)) {
    idx -= 1;
    prev = ONBOARDING_STEP_ORDER[idx - 1] ?? null;
  }
  if (prev === 'intro' && readOnboardingStarted()) return null;
  return prev;
}

export function progressDotIndex(step: OnboardingStepId): number {
  if (step === 'intro') return -1;
  return QUESTION_STEP_IDS.indexOf(step as Exclude<OnboardingStepId, 'intro'>);
}

export function firstOnboardingStepAfterIntro(options: OnboardingSkipOptions): OnboardingStepId {
  if (!options.skipLegal) return 'legal';
  if (!options.skipPassword) return 'password';
  return 'nickname';
}
