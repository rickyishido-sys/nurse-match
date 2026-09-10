'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingStatus } from '@/components/connection/ui/loading-status';
import {
  HANAKAI_NAV_DONE_EVENT,
  HANAKAI_NAV_PENDING_EVENT,
} from '@/lib/connection/reliable-navigate';

/**
 * Cream full-screen overlay during navigations that would otherwise flash black
 * in Capacitor/iOS WebView (full reloads) or feel "stuck" during soft RSC waits.
 */
export function NavigationPendingOverlay() {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('読み込み中');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function shouldHandle(anchor: HTMLAnchorElement): boolean {
      if (anchor.target && anchor.target !== '_self') return false;
      if (anchor.hasAttribute('download')) return false;
      // ReliableNavLink manages overlay + soft/hard fallback itself.
      if (anchor.dataset.reliableNav === '1') return false;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return false;
      }
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        return false;
      }
      return true;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!shouldHandle(anchor)) return;

      setLabel('読み込み中');
      setVisible(true);
    }

    function onPending() {
      setLabel('読み込み中');
      setVisible(true);
    }

    function onDone() {
      setVisible(false);
    }

    function onPageShow() {
      setVisible(false);
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener(HANAKAI_NAV_PENDING_EVENT, onPending);
    window.addEventListener(HANAKAI_NAV_DONE_EVENT, onDone);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(HANAKAI_NAV_PENDING_EVENT, onPending);
      window.removeEventListener(HANAKAI_NAV_DONE_EVENT, onDone);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#faf7f2]'
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <p className='text-sm font-semibold tracking-[0.18em] text-[#1f5d4f]'>HANAKAI</p>
      <LoadingStatus variant='block' label={label} />
    </div>
  );
}
