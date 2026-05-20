export type RuntimePlatform = 'web' | 'app';

export const runtimePlatform: RuntimePlatform =
  process.env.NEXT_PUBLIC_RUNTIME_PLATFORM === 'app' ? 'app' : 'web';

export function isAppPlatform() {
  return runtimePlatform === 'app';
}

export function isWebPlatform() {
  return runtimePlatform === 'web';
}

export function getPlatformLabel() {
  return isAppPlatform() ? 'app' : 'web';
}

export function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
