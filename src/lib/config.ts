import { getPlatformLabel, isAppPlatform } from '@/lib/platform';

export const APP_NAME = 'Nurse Match';
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const STORAGE_BUCKETS = {
  profile: 'profile-images',
  identity: 'identity-documents',
  nurse: 'nurse-documents',
} as const;

export const RUNTIME_PLATFORM = getPlatformLabel();
export const IS_APP_RUNTIME = isAppPlatform();
