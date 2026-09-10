'use client';

/**
 * Soft navigation with a hard-navigation fallback for iPhone WebKit / Capacitor.
 *
 * History: plain Next.js <Link> soft-nav from /connections → detail (and some
 * profile routes) could no-op on iPhone. Native <a> fixed reliability but caused
 * full document reloads (~4–5s). This helper prefers router.push/replace, and
 * only falls back to location.assign if the URL does not change in time.
 */

export const HANAKAI_NAV_PENDING_EVENT = 'hanakai:nav-pending';
export const HANAKAI_NAV_DONE_EVENT = 'hanakai:nav-done';

/** Soft-nav grace period before hard fallback. Keep short enough to recover from
 *  no-ops, but long enough not to abort a slow-but-working RSC fetch. */
export const RELIABLE_NAV_FALLBACK_MS = 1600;

export function notifyNavigationPending(href?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HANAKAI_NAV_PENDING_EVENT, { detail: { href } }));
}

export function notifyNavigationDone() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HANAKAI_NAV_DONE_EVENT));
}

export function sameAppUrl(href: string): { pathname: string; search: string; href: string } | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return { pathname: url.pathname, search: url.search, href: url.pathname + url.search + url.hash };
  } catch {
    return null;
  }
}

export function currentAppUrl(): string {
  return window.location.pathname + window.location.search;
}

type NavigateOptions = {
  replace?: boolean;
  /** Soft-nav timeout before hard fallback (ms). */
  fallbackMs?: number;
  /** Show the cream pending overlay. */
  showOverlay?: boolean;
};

/**
 * Prefer App Router soft navigation; hard-navigate only if soft nav no-ops.
 */
export function reliableNavigate(
  href: string,
  push: (href: string) => void,
  replace: (href: string) => void,
  options: NavigateOptions = {},
): void {
  const parsed = sameAppUrl(href);
  if (!parsed) {
    window.location.assign(href);
    return;
  }

  const target = parsed.pathname + parsed.search;
  if (target === currentAppUrl()) {
    notifyNavigationDone();
    return;
  }

  if (options.showOverlay !== false) {
    notifyNavigationPending(parsed.href);
  }

  const start = currentAppUrl();
  const fallbackMs = options.fallbackMs ?? RELIABLE_NAV_FALLBACK_MS;
  const startedAt = Date.now();
  let settled = false;

  const settleIfMoved = () => {
    if (settled) return true;
    if (currentAppUrl() !== start) {
      settled = true;
      notifyNavigationDone();
      return true;
    }
    return false;
  };

  try {
    if (options.replace) replace(parsed.href);
    else push(parsed.href);
  } catch {
    settled = true;
    window.location.assign(parsed.href);
    return;
  }

  const tick = () => {
    if (settleIfMoved()) return;
    if (Date.now() - startedAt >= fallbackMs) {
      if (settleIfMoved()) return;
      settled = true;
      // Soft nav appeared stuck (iPhone no-op). Hard navigation is the reliable path.
      window.location.assign(parsed.href);
      return;
    }
    window.setTimeout(tick, 50);
  };

  window.setTimeout(tick, 50);
}
