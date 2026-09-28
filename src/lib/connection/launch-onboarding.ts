export const LAUNCH_ONBOARDING_STORAGE_KEY = 'hanakai:launch-onboarding-seen:v1';

export function hasSeenLaunchOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(LAUNCH_ONBOARDING_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function markLaunchOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAUNCH_ONBOARDING_STORAGE_KEY, '1');
  } catch {
    // Storage may be unavailable; avoid blocking UX.
  }
}
