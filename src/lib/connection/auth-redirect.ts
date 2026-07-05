/** メール認証後の最終着地（Connection 新規登録） */
export const HANAKAI_POST_AUTH_PROFILE_PATH = '/register/profile';

export function hanakaiEmailRedirectUrl(siteOrigin: string): string {
  const base = siteOrigin.replace(/\/$/, '');
  return `${base}/auth/callback?next=${encodeURIComponent(HANAKAI_POST_AUTH_PROFILE_PATH)}`;
}

/** next パラメータを常にプロフィール入力へ正規化 */
export function resolveHanakaiPostAuthPath(nextRaw: string | null | undefined): string {
  if (nextRaw === HANAKAI_POST_AUTH_PROFILE_PATH) return HANAKAI_POST_AUTH_PROFILE_PATH;
  if (nextRaw === '/register/continue') return HANAKAI_POST_AUTH_PROFILE_PATH;
  if (nextRaw === '/register/details') return '/register/details';
  return HANAKAI_POST_AUTH_PROFILE_PATH;
}
