import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getUserById } from '@/lib/mock-data';

const PUBLIC_PATHS = ['/', '/login', '/register', '/terms', '/privacy', '/community-guidelines', '/preview', '/admin/login'];
const ADMIN_BYPASS_PATHS = ['/register', '/preview', '/pending-review'];

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

  if (
    PUBLIC_PATHS.some((path) => pathname === path) ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/hero') ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'false') {
    const demo = request.cookies.get('demo_user_id');
    if (!demo) {
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
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
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
    return NextResponse.redirect(new URL(isAdminPath ? '/admin/login' : '/login', request.url));
  }

  if (isAdminPath) {
    const { data: roleData } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    const role = roleData?.role;
    const hasAdminRole = isAdminRole(role);
    if (!hasAdminRole && !isAdminLogin) {
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

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
