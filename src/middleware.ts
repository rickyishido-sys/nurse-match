import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getUserById } from '@/lib/mock-data';

const PUBLIC_PATHS = ['/', '/login', '/register', '/terms', '/privacy', '/community-guidelines', '/preview', '/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';

  if (
    PUBLIC_PATHS.some((path) => pathname === path) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
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
    const isAdminRole = demoUser?.role === 'female_admin' || demoUser?.role === 'male_admin' || demoUser?.role === 'super_admin';
    if (isAdminPath && !isAdminLogin && !isAdminRole) return NextResponse.redirect(new URL('/home', request.url));
    if (pathname === '/admin' && demoUser?.role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
    if (pathname === '/admin' && demoUser?.role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
    if (isAdminLogin && isAdminRole) {
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
    const isAdminRole = role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
    if (!isAdminRole && !isAdminLogin) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    if (pathname === '/admin' && role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
    if (pathname === '/admin' && role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
    if (isAdminLogin && isAdminRole) {
      if (role === 'female_admin') return NextResponse.redirect(new URL('/admin/female', request.url));
      if (role === 'male_admin') return NextResponse.redirect(new URL('/admin/male', request.url));
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
