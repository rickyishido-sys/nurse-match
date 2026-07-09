import { SITE_URL } from '@/lib/config';

/** メール認証後の着地先（Connection 新規登録） */
export const HANAKAI_POST_AUTH_PROFILE_PATH = '/register/profile';

/** HANAKAI Connection の正規オリジン（認証メールの redirectTo 用） */
export const HANAKAI_CANONICAL_ORIGIN = 'https://hanakai.kranz.design';

function isLocalOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * メール認証リンクの redirectTo に使うサイトオリジンを解決する。
 * 本番では常に hanakai.kranz.design。nurse.kranz.design へのフォールバックはしない。
 */
export function resolveHanakaiSiteOrigin(requestOrigin?: string | null): string {
  let origin = normalizeOrigin(SITE_URL);

  if (origin.includes('nurse.kranz.design')) {
    origin = HANAKAI_CANONICAL_ORIGIN;
  }

  if (process.env.VERCEL_ENV === 'production') {
    return HANAKAI_CANONICAL_ORIGIN;
  }

  if (process.env.NODE_ENV === 'development' && requestOrigin && isLocalOrigin(requestOrigin)) {
    return normalizeOrigin(requestOrigin);
  }

  return origin;
}

export function hanakaiEmailRedirectUrl(requestOrigin?: string | null): string {
  return `${resolveHanakaiSiteOrigin(requestOrigin)}/auth/callback`;
}
