'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import type { HanakaiViewer } from '@/lib/hanakai/session';

export function LandingNav({
  joinHref = '/register',
  viewer = null,
}: {
  joinHref?: string;
  viewer?: HanakaiViewer | null;
}) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? 'border-b border-[#ece6da] bg-[#faf7f2]/92 backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className='mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4'>
        <Link href='/' className='flex min-w-0 flex-col leading-none'>
          <span
            className={`text-[15px] font-semibold tracking-[0.16em] transition-colors sm:text-[16px] sm:tracking-[0.18em] ${
              solid ? 'text-[#1a1a1a]' : 'text-white'
            }`}
          >
            華会
          </span>
          <span
            className={`mt-0.5 font-serif text-[9px] font-medium tracking-[0.28em] transition-colors sm:text-[10px] sm:tracking-[0.32em] ${
              solid ? 'text-[#b8956a]' : 'text-white/70'
            }`}
          >
            HANAKAI
          </span>
        </Link>

        <nav className='flex shrink-0 items-center gap-1.5 sm:gap-2.5'>
          <Link
            href='/events'
            className={`flex h-9 items-center rounded-full px-3 text-[11px] font-semibold transition sm:px-4 sm:text-xs ${
              solid ? 'text-[#1a1a1a] hover:bg-black/5' : 'text-white hover:bg-white/10'
            }`}
          >
            イベント
          </Link>
          {viewer ? (
            <HeaderUserMenu user={viewer} />
          ) : (
            <Link
              href='/login'
              className={`flex h-9 items-center rounded-full px-3.5 text-[11px] font-semibold transition active:scale-[0.97] sm:px-4 sm:text-xs ${
                solid ? 'border border-[#1f5d4f]/20 text-[#1f5d4f] hover:bg-[#f3f7f5]' : 'border border-white/50 text-white hover:bg-white/10'
              }`}
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
