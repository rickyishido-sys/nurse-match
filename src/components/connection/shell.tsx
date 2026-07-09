import Link from 'next/link';
import { ConnectionBottomNav } from '@/components/connection/bottom-nav';
import { BrandFooter } from '@/components/connection/brand/brand-footer';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
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
    <div className={`${CONNECTION_SHELL_CLASS} bg-[#faf7f2]`}>
      <header className='sticky top-0 z-20 border-b border-white/40 bg-white/70 px-5 py-4 backdrop-blur-xl'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex flex-col'>
            <span className='font-serif text-[15px] font-semibold tracking-[0.16em] text-[#1a1a1a]'>華会</span>
            <span className='text-[10px] font-medium tracking-[0.28em] text-[#b8956a]'>HANAKAI</span>
          </Link>
          <div className='flex items-center gap-2'>
            {viewer ? (
              <HeaderUserMenu user={viewer} />
            ) : (
              <>
                <Link
                  href='/login'
                  className='rounded-full border border-[#d8d6d1]/80 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#6b6b6b] backdrop-blur transition hover:bg-white'
                >
                  ログイン
                </Link>
                <Link
                  href='/events'
                  className='hk-brand-btn rounded-full bg-[#1f5d4f] px-3 py-1.5 text-xs font-medium text-white'
                >
                  イベントを見る
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
    </div>
  );
}
