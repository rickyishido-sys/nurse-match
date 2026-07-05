/** メール認証後の着地先（Connection 新規登録） */
export const HANAKAI_POST_AUTH_PROFILE_PATH = '/register/profile';

export function hanakaiEmailRedirectUrl(siteOrigin: string): string {
  const base = siteOrigin.replace(/\/$/, '');
  return `${base}/auth/callback`;
}
