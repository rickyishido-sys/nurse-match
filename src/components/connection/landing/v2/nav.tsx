'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { RegisterCtaLink } from '@/components/connection/register-cta-link';
import type { HanakaiViewer } from '@/lib/hanakai/session';

function navLinkClass(solid: boolean, accent = false) {
  if (solid) {
    return accent
      ? 'text-[#e85d4c] hover:bg-[#fff5f3]'
      : 'text-[#1a1a1a] hover:bg-black/5';
  }
  return accent ? 'text-white/90 hover:bg-white/10' : 'text-white hover:bg-white/10';
}

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

  const eventsLink = (
    <Link
      href='/events'
      prefetch
      className={`flex h-9 items-center rounded-full px-3 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${navLinkClass(solid)}`}
    >
      イベントを見る
    </Link>
  );

  const loginLink = (
    <Link
      href='/login'
      prefetch
      className={`flex h-9 items-center rounded-full border px-3 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
        solid
          ? 'border-[#d8d6d1]/80 bg-white/70 text-[#1a1a1a] hover:bg-white'
          : 'border-white/50 bg-white/10 text-white hover:bg-white/15'
      }`}
    >
      ログイン
    </Link>
  );

  const createLink = (
    <Link
      href='/events/create'
      prefetch
      className={`flex h-9 items-center rounded-full px-2.5 text-[12px] font-medium transition sm:px-3 sm:text-[13px] ${
        solid ? 'text-[#9a9a9a] hover:bg-black/5 hover:text-[#6b6b6b]' : 'text-white/55 hover:bg-white/10 hover:text-white/75'
      }`}
    >
      作る
    </Link>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors duration-500 ${
        solid ? 'border-b border-[#ece6da] bg-[#faf7f2]/92 backdrop-blur' : 'bg-transparent'
      }`}
    >
      {/* Mobile: logo + auth CTAs on top; events / demoted create on second row */}
      <div className='mx-auto w-full max-w-[1080px] px-4 py-3 sm:hidden'>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0 shrink-0'>
            <BrandLogo href='/' size='md' tone={solid ? 'default' : 'onLight'} />
          </div>
          <div className='flex min-w-0 shrink-0 items-center gap-1.5'>
            {viewer ? (
              <HeaderUserMenu user={viewer} />
            ) : (
              <>
                {loginLink}
                <RegisterCtaLink href={joinHref} className='!min-h-9 !shrink-0 !px-3.5 !text-[13px]' />
              </>
            )}
          </div>
        </div>
        <nav className='mt-2.5 flex flex-wrap items-center gap-2'>
          {eventsLink}
          {createLink}
        </nav>
      </div>

      {/* Desktop / tablet */}
      <div className='mx-auto hidden w-full max-w-[1080px] items-center justify-between gap-3 px-6 py-4 sm:flex'>
        <BrandLogo href='/' size='md' tone={solid ? 'default' : 'onLight'} />
        <nav className='flex shrink-0 items-center gap-2.5'>
          {eventsLink}
          {!viewer ? (
            <>
              {loginLink}
              <RegisterCtaLink href={joinHref} className='!min-h-9 !px-4 !text-sm' />
              {createLink}
            </>
          ) : (
            <>
              {createLink}
              <HeaderUserMenu user={viewer} />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
