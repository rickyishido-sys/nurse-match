import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextRaw = requestUrl.searchParams.get('next') || '/register/details';
  const nextPath = nextRaw.startsWith('/') ? nextRaw : '/register/details';
  console.log('AUTH_CALLBACK_START', { hasCode: Boolean(code), next: nextPath });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/login?error=auth-callback&detail=missing_config', requestUrl.origin));
  }

  let response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
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
        response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth-callback&detail=missing_code', requestUrl.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('AUTH_CALLBACK_ERROR', error);
    const detail = encodeURIComponent(error.message ?? 'exchange_failed');
    return NextResponse.redirect(new URL(`/login?error=auth-callback&detail=${detail}`, requestUrl.origin));
  }

  console.log('AUTH_CALLBACK_SUCCESS', { next: nextPath });
  return response;
}
