import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import {
  HANAKAI_POST_AUTH_PROFILE_PATH,
  resolveHanakaiPostAuthPath,
} from '@/lib/connection/auth-redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type');
  const nextRaw = requestUrl.searchParams.get('next');
  const safeNext = resolveHanakaiPostAuthPath(nextRaw);
  const profileUrl = new URL(HANAKAI_POST_AUTH_PROFILE_PATH, requestUrl.origin);
  let redirectTo: URL | string = profileUrl;
  let sessionEstablished = false;

  console.log('AUTH_CALLBACK_START', {
    requestUrl: request.url,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    hasType: Boolean(otpType),
    next: safeNext,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/register?error=auth-callback&detail=missing_config', requestUrl.origin));
  }

  let response = NextResponse.redirect(profileUrl);
  const requestCookies = request.headers.get('cookie') ?? '';
  const parsedCookies = requestCookies
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const index = item.indexOf('=');
      if (index < 0) return { name: item, value: '' };
      return { name: item.slice(0, index), value: decodeURIComponent(item.slice(index + 1)) };
    });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parsedCookies;
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(profileUrl);
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('AUTH_CALLBACK_EXCHANGE_ERROR', error);
        if (error.message?.toLowerCase().includes('code verifier')) {
          redirectTo = new URL(`/auth/complete?next=${encodeURIComponent(safeNext)}`, requestUrl.origin);
        } else {
          redirectTo = '/register?error=auth-callback&detail=exchange_failed';
        }
      } else {
        sessionEstablished = true;
        console.log('AUTH_CALLBACK_EXCHANGE_RESULT', { success: true });
      }
    } else if (tokenHash && otpType) {
      const allowedTypes: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change'];
      const normalizedType = allowedTypes.includes(otpType as EmailOtpType) ? (otpType as EmailOtpType) : null;
      if (!normalizedType) {
        redirectTo = '/register?error=auth-callback&detail=verify_failed';
      } else {
        const { error } = await supabase.auth.verifyOtp({
          type: normalizedType,
          token_hash: tokenHash,
        });
        if (error) {
          console.error('AUTH_CALLBACK_VERIFY_OTP_ERROR', error);
          redirectTo = '/register?error=auth-callback&detail=verify_failed';
        } else {
          sessionEstablished = true;
          console.log('AUTH_CALLBACK_VERIFY_RESULT', { success: true, type: normalizedType });
        }
      }
    }

    if (sessionEstablished) {
      redirectTo = profileUrl;
      response = NextResponse.redirect(profileUrl);
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('AUTH_CALLBACK_GET_SESSION_RESULT', {
        hasSession: Boolean(sessionData.session),
      });
    }
  } catch (error) {
    console.error('AUTH_CALLBACK_UNEXPECTED_ERROR', error);
    redirectTo = '/register?error=auth-callback&detail=unexpected';
  }

  console.log('AUTH_CALLBACK_FINAL_REDIRECT', { redirectTo: String(redirectTo), sessionEstablished });
  if (typeof redirectTo === 'string') {
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }
  return response;
}
