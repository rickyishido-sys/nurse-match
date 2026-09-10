'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ComponentProps, type MouseEvent } from 'react';
import { reliableNavigate } from '@/lib/connection/reliable-navigate';

type ReliableNavLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  /** Defaults to true — viewport/hover prefetch for faster soft nav. */
  prefetch?: boolean;
  /** Use router.replace instead of push. */
  replace?: boolean;
};

/**
 * App-shell navigation that prefers soft routing with a hard fallback.
 * Use for known iPhone-fragile routes (connections → detail, participants → profile).
 * Do not use for external URLs, downloads, or auth redirects that must full-reload.
 */
export function ReliableNavLink({
  href,
  replace = false,
  prefetch = true,
  onClick,
  children,
  ...rest
}: ReliableNavLinkProps) {
  const router = useRouter();
  const hrefString = typeof href === 'string' ? href : href.pathname ? `${href.pathname}${href.search ?? ''}${href.hash ?? ''}` : '';

  useEffect(() => {
    if (!prefetch || !hrefString) return;
    try {
      router.prefetch(hrefString);
    } catch {
      // prefetch is best-effort
    }
  }, [hrefString, prefetch, router]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!hrefString) return;

    event.preventDefault();
    reliableNavigate(hrefString, router.push, router.replace, { replace, showOverlay: true });
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      replace={replace}
      onClick={handleClick}
      data-reliable-nav='1'
      {...rest}
    >
      {children}
    </Link>
  );
}
