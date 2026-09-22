export const HANAKAI_RESET_PASSWORD_PATH = '/reset-password';
export const HANAKAI_PW_RECOVERY_COOKIE = 'hanakai_pw_recovery';
export const HANAKAI_PW_RECOVERY_COOKIE_MAX_AGE = 60 * 60;

function normalizeAuthType(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isHanakaiRecoveryType(value: string | null | undefined): boolean {
  return normalizeAuthType(value) === 'recovery';
}

export function isHanakaiResetPasswordNext(next: string | null | undefined): boolean {
  return next === HANAKAI_RESET_PASSWORD_PATH;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf8')
        : atob(padded);
    const payload = JSON.parse(json) as unknown;
    if (!payload || typeof payload !== 'object') return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function amrMethods(accessToken: string | null | undefined): string[] {
  if (!accessToken) return [];
  const payload = decodeJwtPayload(accessToken);
  const amr = payload?.amr;
  if (!Array.isArray(amr)) return [];
  return amr
    .map((entry) => {
      if (typeof entry === 'string') return normalizeAuthType(entry);
      if (entry && typeof entry === 'object' && 'method' in entry) {
        return normalizeAuthType(String((entry as { method?: unknown }).method ?? ''));
      }
      return '';
    })
    .filter(Boolean);
}

/** PASSWORD_RECOVERY 相当: JWT amr に recovery grant がある */
export function accessTokenHasRecoveryAmr(accessToken: string | null | undefined): boolean {
  return amrMethods(accessToken).includes('recovery');
}

const NON_RECOVERY_AUTH_TYPES = new Set(['signup', 'invite', 'magiclink', 'email', 'email_change']);

export function isRecentRecoverySentAt(value: string | null | undefined, nowMs = Date.now()): boolean {
  if (!value) return false;
  const sentAt = Date.parse(value);
  if (Number.isNaN(sentAt)) return false;
  return nowMs - sentAt >= 0 && nowMs - sentAt <= 2 * 60 * 60 * 1000;
}

export function isHanakaiPasswordRecovery(input: {
  type?: string | null;
  next?: string | null;
  redirectType?: string | null;
  accessToken?: string | null;
  recoverySentAt?: string | null;
}): boolean {
  if (isHanakaiResetPasswordNext(input.next)) return true;
  if (isHanakaiRecoveryType(input.type)) return true;
  if (isHanakaiRecoveryType(input.redirectType)) return true;
  if (accessTokenHasRecoveryAmr(input.accessToken)) return true;
  const authType = normalizeAuthType(input.type || input.redirectType);
  if (authType && NON_RECOVERY_AUTH_TYPES.has(authType)) return false;
  if (isRecentRecoverySentAt(input.recoverySentAt)) return true;
  return false;
}

export function resolvePostAuthPath(input: {
  sessionEstablished: boolean;
  type?: string | null;
  next?: string | null;
  redirectType?: string | null;
  accessToken?: string | null;
  recoverySentAt?: string | null;
  profilePath: string;
  errorPath?: string;
}): string {
  if (!input.sessionEstablished) {
    return input.errorPath ?? input.profilePath;
  }
  if (
    isHanakaiPasswordRecovery({
      type: input.type,
      next: input.next,
      redirectType: input.redirectType,
      accessToken: input.accessToken,
      recoverySentAt: input.recoverySentAt,
    })
  ) {
    return HANAKAI_RESET_PASSWORD_PATH;
  }
  if (input.next === '/register/details') return '/register/details';
  return input.profilePath;
}

export function recoveryCookieSetOptions(secure: boolean) {
  return {
    path: '/' as const,
    sameSite: 'lax' as const,
    httpOnly: true,
    secure,
    maxAge: HANAKAI_PW_RECOVERY_COOKIE_MAX_AGE,
  };
}
