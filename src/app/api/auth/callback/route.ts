import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next');
  const profilePath =
    next === '/register/details'
      ? '/register/details'
      : next === '/reset-password'
        ? '/reset-password'
        : HANAKAI_POST_AUTH_PROFILE_PATH;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/register?error=auth-callback&detail=missing_config', requestUrl.origin));
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL('/register?error=auth-callback&detail=missing_params', requestUrl.origin));
  }

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

  const cookiesToApply: CookieToSet[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parsedCookies;
      },
      setAll(cookiesToSet) {
        cookiesToApply.push(
          ...cookiesToSet.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
            options: cookie.options as Record<string, unknown> | undefined,
          })),
        );
      },
    },
  });

  let redirectPath = profilePath;
  let sessionEstablished = false;

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('AUTH_CALLBACK_EXCHANGE_ERROR', { code: error.code ?? null, status: error.status ?? null });
        redirectPath = '/register?error=auth-callback&detail=exchange_failed';
      } else {
        sessionEstablished = true;
      }
    } else if (tokenHash && otpType) {
      const allowedTypes: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change'];
      const normalizedType = allowedTypes.includes(otpType as EmailOtpType) ? (otpType as EmailOtpType) : null;
      if (!normalizedType) {
        redirectPath = '/register?error=auth-callback&detail=verify_failed';
      } else {
        const { error } = await supabase.auth.verifyOtp({
          type: normalizedType,
          token_hash: tokenHash,
        });
        if (error) {
          console.error('AUTH_CALLBACK_VERIFY_OTP_ERROR', { code: error.code ?? null, status: error.status ?? null });
          redirectPath = '/register?error=auth-callback&detail=verify_failed';
        } else {
          sessionEstablished = true;
        }
      }
    }

    if (sessionEstablished) {
      redirectPath =
        next === '/reset-password' || next === '/register/details' ? next : profilePath;
    }
  } catch (error) {
    console.error('AUTH_CALLBACK_UNEXPECTED_ERROR', {
      message: error instanceof Error ? error.message : 'unexpected',
    });
    redirectPath = '/register?error=auth-callback&detail=unexpected';
  }

  const finalResponse = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  for (const cookie of cookiesToApply) {
    finalResponse.cookies.set(cookie.name, cookie.value, {
      path: '/',
      ...(cookie.options as object | undefined),
    } as never);
  }
  return finalResponse;
}
