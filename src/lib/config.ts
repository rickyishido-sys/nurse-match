import { getPlatformLabel, isAppPlatform } from '@/lib/platform';

export const APP_NAME = 'HANAKAI Connection';
export const APP_NAME_JA = 'Connection';
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const STORAGE_BUCKETS = {
  profile: 'profile-images',
  post: 'post-images',
  event: 'event-images',
  // Legacy buckets retained for backward-compatible upload helpers.
  identity: 'identity-documents',
  nurse: 'nurse-documents',
} as const;

export const RUNTIME_PLATFORM = getPlatformLabel();
export const IS_APP_RUNTIME = isAppPlatform();
