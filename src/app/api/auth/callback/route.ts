import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';
import {
  HANAKAI_PW_RECOVERY_COOKIE,
  HANAKAI_RESET_PASSWORD_PATH,
  isHanakaiPasswordRecovery,
  recoveryCookieSetOptions,
  resolvePostAuthPath,
} from '@/lib/connection/auth-recovery';
import { HANAKAI_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie-options';
import { applyAuthCookies } from '@/lib/supabase/auth-cookies';

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
  const profilePath = HANAKAI_POST_AUTH_PROFILE_PATH;
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
  const cookieResponseHeaders: Record<string, string> = {};
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: HANAKAI_AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return parsedCookies;
      },
      setAll(cookiesToSet, headers) {
        cookiesToApply.push(
          ...cookiesToSet.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
            options: cookie.options as Record<string, unknown> | undefined,
          })),
        );
        Object.assign(cookieResponseHeaders, headers);
      },
    },
  });

  let redirectPath = profilePath;
  let sessionEstablished = false;
  let redirectType: string | null = null;
  let accessToken: string | null = null;
  let recoverySentAt: string | null = null;

  try {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('AUTH_CALLBACK_EXCHANGE_ERROR', { code: error.code ?? null, status: error.status ?? null });
        redirectPath = '/register?error=auth-callback&detail=exchange_failed';
      } else {
        sessionEstablished = true;
        redirectType = (data as { redirectType?: string | null } | null)?.redirectType ?? null;
        accessToken = data.session?.access_token ?? null;
        if (!accessToken) {
          accessToken = (await supabase.auth.getSession()).data.session?.access_token ?? null;
        }
        recoverySentAt = data.user?.recovery_sent_at ?? data.session?.user?.recovery_sent_at ?? null;
      }
    } else if (tokenHash && otpType) {
      const allowedTypes: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change'];
      const normalizedType = allowedTypes.includes(otpType as EmailOtpType) ? (otpType as EmailOtpType) : null;
      if (!normalizedType) {
        redirectPath = '/register?error=auth-callback&detail=verify_failed';
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          type: normalizedType,
          token_hash: tokenHash,
        });
        if (error) {
          console.error('AUTH_CALLBACK_VERIFY_OTP_ERROR', { code: error.code ?? null, status: error.status ?? null });
          redirectPath = '/register?error=auth-callback&detail=verify_failed';
        } else {
          sessionEstablished = true;
          redirectType = normalizedType;
          accessToken = data.session?.access_token ?? null;
          recoverySentAt = data.user?.recovery_sent_at ?? data.session?.user?.recovery_sent_at ?? null;
        }
      }
    }

    if (sessionEstablished) {
      redirectPath = resolvePostAuthPath({
        sessionEstablished: true,
        type: otpType,
        next,
        redirectType,
        accessToken,
        recoverySentAt,
        profilePath,
      });
    }
  } catch (error) {
    console.error('AUTH_CALLBACK_UNEXPECTED_ERROR', {
      message: error instanceof Error ? error.message : 'unexpected',
    });
    redirectPath = '/register?error=auth-callback&detail=unexpected';
  }

  const finalResponse = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  applyAuthCookies(finalResponse, cookiesToApply);
  for (const [key, value] of Object.entries(cookieResponseHeaders)) {
    finalResponse.headers.set(key, value);
  }
  if (
    redirectPath === HANAKAI_RESET_PASSWORD_PATH ||
    isHanakaiPasswordRecovery({ type: otpType, next, redirectType, accessToken, recoverySentAt })
  ) {
    finalResponse.cookies.set(
      HANAKAI_PW_RECOVERY_COOKIE,
      '1',
      recoveryCookieSetOptions(process.env.NODE_ENV === 'production'),
    );
  }
  return finalResponse;
}
