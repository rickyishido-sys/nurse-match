import type { ConnectionMember } from '@/lib/connection/types';

export type OnboardingStepId =
  | 'intro'
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

function isStepId(value: string | null): value is OnboardingStepId {
  return Boolean(value && ONBOARDING_STEP_ORDER.includes(value as OnboardingStepId));
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

/** サーバー側の既存データから最初の未完了ステップを推定 */
export function inferResumeStep(
  member: ConnectionMember | null | undefined,
  hasPasswordSet: boolean,
): OnboardingStepId {
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
  const started = readOnboardingStarted();
  const stored = readStoredOnboardingStep();

  if (started && stored && stored !== 'intro') {
    console.log('BLOOM_ONBOARDING_RESTORE_STEP', { stored, started });
    return stored;
  }

  if (started) {
    const resume = hasPasswordSet ? inferResumeStep(member, true) : 'password';
    console.log('BLOOM_ONBOARDING_RESTORE_STEP', { stored: resume, started, reason: 'started_without_step' });
    return resume;
  }

  return 'intro';
}

export function stepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEP_ORDER.indexOf(step);
}

export function nextStepId(current: OnboardingStepId, skipPassword: boolean): OnboardingStepId | null {
  const idx = stepIndex(current);
  if (idx < 0 || idx >= ONBOARDING_STEP_ORDER.length - 1) return null;
  let next = ONBOARDING_STEP_ORDER[idx + 1];
  if (skipPassword && next === 'password') {
    next = ONBOARDING_STEP_ORDER[idx + 2] ?? next;
  }
  return next;
}

export function prevStepId(current: OnboardingStepId, skipPassword: boolean): OnboardingStepId | null {
  const idx = stepIndex(current);
  if (idx <= 0) return null;
  let prev = ONBOARDING_STEP_ORDER[idx - 1];
  if (skipPassword && prev === 'password') {
    prev = ONBOARDING_STEP_ORDER[idx - 2] ?? prev;
  }
  if (prev === 'intro' && readOnboardingStarted()) return null;
  return prev;
}

export function progressDotIndex(step: OnboardingStepId): number {
  if (step === 'intro') return -1;
  return QUESTION_STEP_IDS.indexOf(step as Exclude<OnboardingStepId, 'intro'>);
}
