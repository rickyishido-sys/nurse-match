import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type');
  const nextRaw = requestUrl.searchParams.get('next');
  const safeNext = nextRaw && nextRaw.startsWith('/') ? nextRaw : '/register/details';
  const callbackSuccessPath = '/auth/complete';
  let redirectTo = callbackSuccessPath;

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
    console.log('AUTH_CALLBACK_FINAL_REDIRECT', {
      redirectTo: '/register?error=auth-callback&detail=missing_config',
    });
    return NextResponse.redirect(new URL('/register?error=auth-callback&detail=missing_config', requestUrl.origin));
  }

  let response = NextResponse.redirect(new URL(callbackSuccessPath, requestUrl.origin));
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
        response = NextResponse.redirect(new URL(callbackSuccessPath, requestUrl.origin));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('AUTH_CALLBACK_EXCHANGE_ERROR', error);
        console.log('AUTH_CALLBACK_EXCHANGE_RESULT', { success: false, message: error.message });
        if (error.message?.toLowerCase().includes('code verifier')) {
          // Some clients complete auth on Supabase side and land here without usable PKCE verifier.
          // Defer to /auth/complete session bridge before treating as hard failure.
          redirectTo = callbackSuccessPath;
        } else {
          redirectTo = '/register?error=auth-callback&detail=exchange_failed';
        }
      } else {
        console.log('AUTH_CALLBACK_EXCHANGE_RESULT', { success: true });
      }
    } else if (tokenHash && otpType) {
      const allowedTypes: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change'];
      const normalizedType = allowedTypes.includes(otpType as EmailOtpType) ? (otpType as EmailOtpType) : null;
      if (!normalizedType) {
        console.log('AUTH_CALLBACK_VERIFY_RESULT', { success: false, reason: 'invalid_type', otpType });
        redirectTo = '/register?error=auth-callback&detail=verify_failed';
      } else {
        const { error } = await supabase.auth.verifyOtp({
          type: normalizedType,
          token_hash: tokenHash,
        });
        if (error) {
          console.error('AUTH_CALLBACK_VERIFY_OTP_ERROR', error);
          console.log('AUTH_CALLBACK_VERIFY_RESULT', { success: false, message: error.message });
          redirectTo = '/register?error=auth-callback&detail=verify_failed';
        } else {
          console.log('AUTH_CALLBACK_VERIFY_RESULT', { success: true, type: normalizedType });
        }
      }
    } else {
      // Some email clients can strip query params while still completing sign-in.
      // Try session bridge first before returning an error to the user.
      redirectTo = callbackSuccessPath;
    }

    if (redirectTo === callbackSuccessPath) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('AUTH_CALLBACK_GET_SESSION_RESULT', {
        success: !sessionError,
        hasSession: Boolean(sessionData.session),
        message: sessionError?.message ?? null,
      });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('AUTH_CALLBACK_GET_USER_ERROR', userError);
      }
      console.log('AUTH_CALLBACK_GET_USER_RESULT', {
        success: !userError,
        hasUser: Boolean(userData.user),
        message: userError?.message ?? null,
        userId: userData.user?.id ?? null,
      });

      // iPhone Gmail in-app browser can delay cookie visibility.
      // Defer final verification to /auth/complete retry bridge.
      redirectTo = callbackSuccessPath;
    }
  } catch (error) {
    console.error('AUTH_CALLBACK_UNEXPECTED_ERROR', error);
    redirectTo = '/register?error=auth-callback&detail=unexpected';
  }

  console.log('AUTH_CALLBACK_FINAL_REDIRECT', { redirectTo });
  response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  return response;
}
