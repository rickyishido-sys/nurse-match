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
      <div className='mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-4'>
        <Link href='/' className='flex flex-col leading-none'>
          <span
            className={`text-[16px] font-semibold tracking-[0.18em] transition-colors ${
              solid ? 'text-[#1a1a1a]' : 'text-white'
            }`}
          >
            HANAKAI
          </span>
          <span
            className={`mt-0.5 text-[10px] font-medium tracking-[0.32em] transition-colors ${
              solid ? 'text-[#8a8378]' : 'text-white/70'
            }`}
          >
            花 会
          </span>
        </Link>

        <nav className='flex items-center gap-2.5'>
          <Link
            href='/events'
            className={`hidden h-9 items-center rounded-full px-4 text-xs font-semibold transition sm:flex ${
              solid
                ? 'text-[#1a1a1a] hover:bg-black/5'
                : 'text-white hover:bg-white/10'
            }`}
          >
            イベントを見る
          </Link>
          {viewer ? (
            <HeaderUserMenu user={viewer} />
          ) : (
            <Link
              href={joinHref}
              className='flex h-9 items-center rounded-full bg-[#1f5d4f] px-4 text-xs font-semibold text-white shadow-sm transition active:scale-[0.97]'
            >
              参加する
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
