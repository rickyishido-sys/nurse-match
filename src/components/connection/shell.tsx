import Link from 'next/link';
import { Suspense } from 'react';
import { ConnectionBottomNav } from '@/components/connection/bottom-nav';
import { BrandFooter } from '@/components/connection/brand/brand-footer';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { NavigationPendingOverlay } from '@/components/connection/navigation-pending-overlay';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import { HK } from '@/lib/connection/brand/tokens';
import { CONNECTION_SHELL_CLASS } from '@/lib/connection/layout-width';
import type { HanakaiViewer } from '@/lib/hanakai/session';

type ConnectionShellProps = {
  viewer: HanakaiViewer | null;
  children: React.ReactNode;
  showNav?: boolean;
  flushMain?: boolean;
};

export function ConnectionShell({ viewer, children, showNav = true, flushMain = false }: ConnectionShellProps) {
  const adminHref = viewer?.isConnectionAdmin ? '/manage' : null;

  return (
    <div className={`${CONNECTION_SHELL_CLASS} hk-vibrant-gradient`}>
      <header className='sticky top-0 z-20 border-b border-white/40 bg-white/70 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] backdrop-blur-xl sm:px-5 sm:pb-4 sm:pt-[calc(1rem+env(safe-area-inset-top,0px))]'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0 shrink-0'>
            <BrandLogo href='/' size='md' />
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            {viewer ? (
              <HeaderUserMenu user={viewer} />
            ) : (
              <>
                <Link
                  href='/events'
                  className={`${ctaPrimary} !px-3 !py-1.5 !text-[13px] sm:!px-3.5 sm:!text-sm`}
                >
                  <span className='sm:hidden'>イベント</span>
                  <span className='hidden sm:inline'>イベントを見る</span>
                </Link>
                <Link
                  href='/login'
                  className='rounded-full border border-[#d8d6d1]/80 bg-white/70 px-3 py-1.5 text-[13px] font-semibold text-[#1a1a1a] backdrop-blur transition hover:bg-white sm:text-sm'
                >
                  ログイン
                </Link>
                <Link
                  href='/register'
                  className='rounded-full px-3 py-1.5 text-[13px] font-semibold text-white sm:px-3.5 sm:text-sm'
                  style={{ background: HK.coral }}
                >
                  新規登録
                </Link>
                <Link
                  href='/events/create'
                  className='hidden rounded-full px-2.5 py-1.5 text-[12px] font-medium text-[#9a9a9a] transition hover:bg-black/5 hover:text-[#6b6b6b] sm:inline'
                >
                  作る
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={`relative flex-1 ${flushMain ? 'px-5 pb-8 pt-0 lg:px-10' : 'px-5 py-8 lg:px-10'} ${showNav ? 'pb-28' : ''}`}
      >
        {children}
      </main>

      <div className={showNav ? 'mb-20' : ''}>
        <BrandFooter dark={false} showCharacters={false} adminHref={adminHref} />
      </div>

      {showNav ? <ConnectionBottomNav /> : null}
      <Suspense fallback={null}>
        <NavigationPendingOverlay />
      </Suspense>
    </div>
  );
}
