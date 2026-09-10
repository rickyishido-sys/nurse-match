'use client';

import { useEffect, useState } from 'react';
import { LoadingStatus } from '@/components/connection/ui/loading-status';

/**
 * Shows a cream full-screen overlay before same-origin full document navigations
 * (native <a href>). Prevents a black WebView flash during Capacitor/iOS reloads.
 */
export function NavigationPendingOverlay() {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('読み込み中');

  useEffect(() => {
    function shouldHandle(anchor: HTMLAnchorElement): boolean {
      if (anchor.target && anchor.target !== '_self') return false;
      if (anchor.hasAttribute('download')) return false;
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

    function onPageShow() {
      setVisible(false);
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('click', onClick, true);
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
