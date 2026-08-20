'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { RegisterCtaLink } from '@/components/connection/register-cta-link';
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
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors duration-500 ${
        solid ? 'border-b border-[#ece6da] bg-[#faf7f2]/92 backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className='mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4'>
        <BrandLogo href='/' size='md' tone={solid ? 'default' : 'onLight'} />

        <nav className='flex shrink-0 items-center gap-1.5 sm:gap-2.5'>
          <Link
            href='/events'
            prefetch
            className={`flex h-9 items-center rounded-full px-3 text-[11px] font-semibold transition sm:px-4 sm:text-xs ${
              solid ? 'text-[#1a1a1a] hover:bg-black/5' : 'text-white hover:bg-white/10'
            }`}
          >
            参加する
          </Link>
          <Link
            href='/events/create'
            prefetch
            className={`flex h-9 items-center rounded-full px-3 text-[11px] font-semibold transition sm:px-4 sm:text-xs ${
              solid ? 'text-[#e85d4c] hover:bg-[#fff5f3]' : 'text-white/90 hover:bg-white/10'
            }`}
          >
            作る
          </Link>
          {!viewer ? (
            <RegisterCtaLink
              href={joinHref}
              className='!min-h-9 !px-3.5 !text-[11px] sm:!px-4 sm:!text-xs'
            />
          ) : (
            <HeaderUserMenu user={viewer} />
          )}
        </nav>
      </div>
    </header>
  );
}
