import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getUserById } from '@/lib/mock-data';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/community-guidelines',
  '/preview',
  '/onboarding',
  '/onboarding-test',
  '/admin/login',
  '/debug',
  '/debug/env',
  '/auth',
  '/auth/callback',
];
const ADMIN_BYPASS_PATHS = ['/register', '/preview', '/onboarding-preview', '/pending-review'];
const MEMBER_ONLY_PATH_PREFIXES = ['/app', '/cards', '/mypage', '/messages', '/discover', '/likes', '/matches', '/chat', '/chats'];
// HANAKAI community browse routes are public (browse-before-join experience).
const HANAKAI_PUBLIC_PREFIXES = ['/home', '/events', '/connections', '/manage', '/admin/connection', '/register/profile'];

function isAdminRole(role: string | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

function adminLandingPath(role: string | undefined) {
  if (role === 'female_admin') return '/admin/female';
  if (role === 'male_admin') return '/admin/male';
  return '/admin';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isMemberOnlyPath = MEMBER_ONLY_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const sbCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.includes('sb-'));

  console.log('MIDDLEWARE_AUTH_CHECK', {
    pathname,
    isAdminPath,
    isMemberOnlyPath,
    useMock: process.env.NEXT_PUBLIC_USE_MOCK !== 'false',
    hasSbCookie: sbCookieNames.length > 0,
    sbCookieNames,
  });

  if (
    PUBLIC_PATHS.some((path) => pathname === path) ||
    HANAKAI_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/hero') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/flow') ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const demo = request.cookies.get('demo_user_id');
    if (!demo) {
      console.log('MIDDLEWARE_REDIRECT_LOGIN', { pathname, redirectReason: 'mock-no-demo-cookie' });
      return NextResponse.redirect(new URL(isAdminPath ? '/admin/login' : '/login', request.url));
    }
    const demoUser = getUserById(demo.value);
    const hasAdminRole = isAdminRole(demoUser?.role);
    if (hasAdminRole && ADMIN_BYPASS_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL(adminLandingPath(demoUser?.role), request.url));
    }
    if (isAdminPath && !isAdminLogin && !hasAdminRole) return NextResponse.redirect(new URL('/home', request.url));
    if (pathname === '/admin' && demoUser?.role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
    if (pathname === '/admin' && demoUser?.role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
    if (isAdminLogin && hasAdminRole) {
      if (demoUser?.role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
      if (demoUser?.role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    console.log('MIDDLEWARE_ALLOW', { pathname, mode: 'mock' });
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    console.log('MIDDLEWARE_REDIRECT_LOGIN', { pathname, redirectReason: 'missing-supabase-env' });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    console.log('MIDDLEWARE_REDIRECT_LOGIN', { pathname, redirectReason: 'no-auth-user' });
    return NextResponse.redirect(new URL(isAdminPath ? '/admin/login' : '/login', request.url));
  }

  console.log('MIDDLEWARE_AUTH_USER', {
    pathname,
    hasUser: Boolean(data.user),
    userId: data.user.id,
    email: data.user.email ?? null,
  });

  if (isMemberOnlyPath) {
    const { data: statusRow } = await supabase
      .from('users')
      .select('verification_status,onboarding_status')
      .eq('id', data.user.id)
      .maybeSingle();
    if (statusRow?.verification_status === 'rejected') {
      console.log('MIDDLEWARE_REDIRECT_LOGIN', { pathname, redirectReason: 'member-rejected' });
      return NextResponse.redirect(new URL('/review-rejected', request.url));
    }
    if (!statusRow || statusRow.verification_status !== 'approved' || statusRow.onboarding_status !== 'verified') {
      console.log('MIDDLEWARE_REDIRECT_LOGIN', {
        pathname,
        redirectReason: 'member-not-approved',
        verificationStatus: statusRow?.verification_status ?? null,
        onboardingStatus: statusRow?.onboarding_status ?? null,
      });
      return NextResponse.redirect(new URL('/pending-review', request.url));
    }
  }

  if (isAdminPath) {
    const { data: roleData } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    const role = roleData?.role;
    const hasAdminRole = isAdminRole(role);
    if (!hasAdminRole && !isAdminLogin) {
      console.log('MIDDLEWARE_REDIRECT_LOGIN', { pathname, redirectReason: 'admin-role-required' });
      return NextResponse.redirect(new URL('/home', request.url));
    }
    if (pathname === '/admin' && role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
    if (pathname === '/admin' && role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
    if (isAdminLogin && hasAdminRole) {
      if (role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
      if (role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (ADMIN_BYPASS_PATHS.includes(pathname)) {
    const { data: roleData } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    const role = roleData?.role;
    if (isAdminRole(role)) {
      return NextResponse.redirect(new URL(adminLandingPath(role), request.url));
    }
  }

  console.log('MIDDLEWARE_ALLOW', { pathname, mode: 'supabase', userId: data.user.id });
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
