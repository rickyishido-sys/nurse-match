/**
 * HANAKAI Connection Ver1.0 — route allowlist / blocklist.
 * Legacy Nurse Match and mock MVP routes return 404 unless explicitly enabled for local dev.
 */

export function shouldEnforceHanakaiRoutePolicy(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_LEGACY_ROUTES !== 'true';
}

/** Canonical redirects for deprecated HANAKAI paths */
export const HANAKAI_ROUTE_REDIRECTS: Record<string, string> = {
  '/delete-account': '/account/delete',
  '/profile/edit': '/my-profile?mode=edit',
  '/blocked-users': '/account/blocked',
};

export const HANAKAI_PUBLIC_EXACT = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/forgot-password/sent',
  '/reset-password',
  '/reset-password/success',
  '/terms',
  '/privacy',
  '/contact',
  '/legal/tokushoho',
  '/community-guidelines',
  '/admin/login',
  '/onboarding',
  '/auth/callback',
  '/not-found',
  '/experience-request',
]);

export const HANAKAI_AUTH_EXACT = new Set(['/home', '/my-profile', '/manage', '/events/create']);

export const HANAKAI_AUTH_PREFIXES = [
  '/account/',
  '/events/manage/',
  '/events/edit/',
  '/manage/',
];

export const HANAKAI_PUBLIC_PREFIXES = [
  '/events/',
  '/connections',
  '/groups/',
  '/profile/',
  '/register/',
  '/auth/',
  '/onboarding/',
  '/legal/',
];

export const HANAKAI_ADMIN_PREFIX = '/admin/hanakai';

export const HANAKAI_BLOCKED_PREFIXES = [
  '/posts',
  '/lives',
  '/discover',
  '/matches',
  '/likes',
  '/chats',
  '/messages',
  '/admin/connection',
  '/admin/male',
  '/admin/female',
  '/admin/reviews',
  '/admin/datefi-interests',
  '/admin/system-check',
  '/members',
  '/support',
  '/instructor',
  '/concept',
  '/datefi',
  '/favorites',
  '/activity',
  '/cards',
  '/app',
  '/mypage',
  '/my',
  '/preview',
  '/onboarding-preview',
  '/onboarding-test',
  '/debug',
  '/pending-review',
  '/rejected',
  '/review-rejected',
  '/suspended',
  '/verification',
  '/home/male',
  '/home/female',
  '/settings',
];

export const HANAKAI_BLOCKED_EXACT = new Set(['/admin', '/settings']);

export type HanakaiRouteDecision =
  | { kind: 'allow_public' }
  | { kind: 'require_auth' }
  | { kind: 'require_admin' }
  | { kind: 'redirect'; destination: string }
  | { kind: 'not_found' };

function isPublicBrowsePath(pathname: string): boolean {
  if (pathname === '/events') return true;
  if (pathname.startsWith('/events/')) {
    if (pathname === '/events/create') return false;
    if (pathname.startsWith('/events/manage/')) return false;
    if (pathname.startsWith('/events/edit/')) return false;
    return true;
  }
  if (pathname === '/connections' || pathname.startsWith('/connections/')) return true;
  if (pathname.startsWith('/groups/')) return true;
  if (pathname.startsWith('/profile/')) return true;
  if (pathname.startsWith('/register/')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/onboarding/')) return true;
  if (pathname.startsWith('/legal/')) return true;
  return false;
}

function isBlockedPath(pathname: string): boolean {
  if (HANAKAI_BLOCKED_EXACT.has(pathname)) return true;
  return HANAKAI_BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveHanakaiRoute(pathname: string): HanakaiRouteDecision {
  if (!shouldEnforceHanakaiRoutePolicy()) {
    return { kind: 'allow_public' };
  }

  const redirect = HANAKAI_ROUTE_REDIRECTS[pathname];
  if (redirect) return { kind: 'redirect', destination: redirect };

  if (isBlockedPath(pathname)) return { kind: 'not_found' };

  if (pathname === HANAKAI_ADMIN_PREFIX || pathname.startsWith(`${HANAKAI_ADMIN_PREFIX}/`)) {
    return { kind: 'require_admin' };
  }

  if (HANAKAI_PUBLIC_EXACT.has(pathname)) return { kind: 'allow_public' };

  if (HANAKAI_AUTH_EXACT.has(pathname)) return { kind: 'require_auth' };

  if (HANAKAI_AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return { kind: 'require_auth' };
  }

  if (isPublicBrowsePath(pathname)) return { kind: 'allow_public' };

  return { kind: 'not_found' };
}

export function isHanakaiStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/hero') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/flow') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}
