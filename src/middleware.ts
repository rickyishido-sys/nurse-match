import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isHanakaiAdminPath } from '@/lib/connection/hanakai-admin-path';
import {
  isHanakaiStaticAsset,
  resolveHanakaiRoute,
  shouldEnforceHanakaiRoutePolicy,
} from '@/lib/connection/hanakai-route-policy';

const DELETED_MEMBER_EXEMPT_PATHS = [
  '/',
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/contact',
  '/community-guidelines',
  '/forgot-password',
  '/forgot-password/sent',
  '/reset-password',
  '/reset-password/success',
];

function isDeletedMemberExemptPath(pathname: string): boolean {
  if (DELETED_MEMBER_EXEMPT_PATHS.includes(pathname)) return true;
  return pathname.startsWith('/auth/') || pathname.startsWith('/onboarding/');
}

const USE_DEMO_AUTH = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

async function redirectIfDeletedHanakaiMember(request: NextRequest): Promise<NextResponse | null> {
  if (USE_DEMO_AUTH) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return null;

  let response = NextResponse.next({ request });
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
  if (!data.user) return null;

  const { data: member } = await supabase
    .from('hanakai_members')
    .select('status')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  if (member?.status !== 'deleted') return null;

  await supabase.auth.signOut();
  const redirectResponse = NextResponse.redirect(new URL('/?account=deleted', request.url));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}

function notFoundResponse(request: NextRequest): NextResponse {
  if (request.headers.get('x-hanakai-not-found-rewrite') === '1') {
    return NextResponse.next();
  }

  const rewriteUrl = new URL('/not-found', request.url);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-hanakai-not-found-rewrite', '1');

  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
}

function loginRedirect(request: NextRequest, pathname: string, admin = false): NextResponse {
  const loginUrl = new URL(admin ? '/admin/login' : '/login', request.url);
  if (
    pathname === '/events/create' ||
    pathname.startsWith('/events/manage/') ||
    pathname.startsWith('/events/edit/') ||
    pathname === '/manage' ||
    pathname.startsWith('/account/') ||
    pathname === '/my-profile' ||
    pathname === '/home'
  ) {
    loginUrl.searchParams.set('next', pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isHanakaiStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (shouldEnforceHanakaiRoutePolicy()) {
    const decision = resolveHanakaiRoute(pathname);

    if (decision.kind === 'redirect') {
      return NextResponse.redirect(new URL(decision.destination, request.url));
    }
    if (decision.kind === 'not_found') {
      return notFoundResponse(request);
    }

    if (
      !USE_DEMO_AUTH &&
      request.cookies.getAll().some((c) => c.name.includes('sb-')) &&
      !isDeletedMemberExemptPath(pathname)
    ) {
      const deletedRedirect = await redirectIfDeletedHanakaiMember(request);
      if (deletedRedirect) return deletedRedirect;
    }

    if (decision.kind === 'allow_public') {
      return NextResponse.next();
    }

    if (decision.kind === 'require_auth' || decision.kind === 'require_admin') {
      if (USE_DEMO_AUTH) {
        const demo = request.cookies.get('demo_user_id');
        if (!demo) return loginRedirect(request, pathname, decision.kind === 'require_admin');
        return NextResponse.next();
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnon) {
        return loginRedirect(request, pathname);
      }

      let response = NextResponse.next({ request });
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
        return loginRedirect(request, pathname, decision.kind === 'require_admin' || isHanakaiAdminPath(pathname));
      }

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
