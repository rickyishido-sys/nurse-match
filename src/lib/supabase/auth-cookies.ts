import type { NextResponse } from 'next/server';

type CookieToApply = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/** Force Path=/ so Magic Link cookies are sent to pages and /api/auth/set-password. */
export function applyAuthCookies(response: NextResponse, cookies: CookieToApply[]) {
  for (const cookie of cookies) {
    const incoming = { ...(cookie.options ?? {}) };
    response.cookies.set(cookie.name, cookie.value, {
      ...incoming,
      path: '/',
    } as never);
  }
}
