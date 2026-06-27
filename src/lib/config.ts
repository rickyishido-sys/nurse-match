import { getPlatformLabel, isAppPlatform } from '@/lib/platform';

export const APP_NAME = 'HANAKAI Connection';
export const APP_NAME_JA = 'Connection';
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/**
 * HANAKAI Connection のデータ保存先バックエンド。
 * - 'mock'（既定）: 既存のインメモリ実装（src/lib/connection/data.ts）
 * - 'supabase'    : Supabase 実データ保存（hanakai_* テーブル）
 * サーバー専用フラグ。未設定時は必ず 'mock'（本番は既定で無影響）。
 * 切替（ロールバック含む）は環境変数の変更のみで即時反映できる。
 */
export type HanakaiConnectionBackend = 'mock' | 'supabase';
export const HANAKAI_CONNECTION_BACKEND: HanakaiConnectionBackend =
  process.env.HANAKAI_CONNECTION_BACKEND === 'supabase' ? 'supabase' : 'mock';

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
