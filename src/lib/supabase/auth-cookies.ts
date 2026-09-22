import type { NextResponse } from 'next/server';
import { mergeAuthCookieSetOptions } from '@/lib/supabase/auth-cookie-options';

type CookieToApply = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/** Force Path=/ and a persistent Max-Age so Magic Link / login cookies survive app relaunch. */
export function applyAuthCookies(response: NextResponse, cookies: CookieToApply[]) {
  for (const cookie of cookies) {
    response.cookies.set(cookie.name, cookie.value, mergeAuthCookieSetOptions(cookie.options) as never);
  }
}
