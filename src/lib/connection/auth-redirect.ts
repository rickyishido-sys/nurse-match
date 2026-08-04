import { SITE_URL } from '@/lib/config';

/** メール認証後の着地先（Connection 新規登録） */
export const HANAKAI_POST_AUTH_PROFILE_PATH = '/register/profile';

/** HANAKAI Connection の正規オリジン（認証メールの redirectTo 用） */
export const HANAKAI_CANONICAL_ORIGIN = 'https://hanakai.kranz.design';

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * メール認証リンクの redirectTo に使うサイトオリジンを解決する。
 *
 * 環境ごとに自動で切り替える:
 * - Production (VERCEL_ENV==='production'): 常に hanakai.kranz.design（Host に依存しない）
 * - Preview / ローカル開発: リクエストが実際に届いたオリジンへ戻す
 *     → Preview では現在の Preview URL、開発では http://localhost:3000
 * - Host が取得できない Preview: デプロイURL (VERCEL_URL) にフォールバック
 * - それ以外: 設定済み SITE_URL（既定は hanakai.kranz.design）
 *
 * localhost 固定は行わない。Preview で本番ドメインへ固定することもしない。
 */
export function resolveHanakaiSiteOrigin(requestOrigin?: string | null): string {
  // 本番は常に正規ドメイン。Host ヘッダに依存させない（ホストヘッダ注入対策）。
  if (process.env.VERCEL_ENV === 'production') {
    return HANAKAI_CANONICAL_ORIGIN;
  }

  // Preview / 開発: 実際にアクセスされたオリジンへ戻す。
  // これで Preview は現在の Preview URL、開発は localhost に正しく戻る。
  if (requestOrigin) {
    return normalizeOrigin(requestOrigin);
  }

  // Preview で Host が取れないケースはデプロイURLにフォールバック。
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return normalizeOrigin(process.env.VERCEL_URL);
  }

  // 最終フォールバック: 設定済みサイトURL（旧ドメインは正規ドメインへ寄せる）。
  const origin = normalizeOrigin(SITE_URL);
  return origin.includes('nurse.kranz.design') ? HANAKAI_CANONICAL_ORIGIN : origin;
}

export function hanakaiEmailRedirectUrl(requestOrigin?: string | null): string {
  return `${resolveHanakaiSiteOrigin(requestOrigin)}/auth/callback`;
}
