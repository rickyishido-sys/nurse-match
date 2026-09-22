/** Chrome / Safari の cookie 上限に合わせた永続期間（約400日）。session cookie にしない。 */
export const HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export const HANAKAI_AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  maxAge: HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === 'production',
};

export function mergeAuthCookieSetOptions(options?: Record<string, unknown>) {
  const incoming = { ...(options ?? {}) };
  const rawMaxAge = incoming.maxAge;
  const isClear = rawMaxAge === 0 || rawMaxAge === '0';
  const maxAge = isClear
    ? 0
    : typeof rawMaxAge === 'number' && rawMaxAge > 0
      ? rawMaxAge
      : HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS;

  const sameSiteRaw = incoming.sameSite;
  const sameSite =
    sameSiteRaw === 'strict' || sameSiteRaw === 'none' || sameSiteRaw === 'lax' || sameSiteRaw === true
      ? sameSiteRaw
      : ('lax' as const);

  return {
    ...incoming,
    path: '/',
    sameSite,
    maxAge,
    secure: process.env.NODE_ENV === 'production' ? true : Boolean(incoming.secure),
  };
}
