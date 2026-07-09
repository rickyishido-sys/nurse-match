import Link from 'next/link';
import { ConnectionBottomNav } from '@/components/connection/bottom-nav';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { LegalLinks } from '@/components/connection/legal-links';
import { CONNECTION_SHELL_CLASS } from '@/lib/connection/layout-width';
import type { HanakaiViewer } from '@/lib/hanakai/session';

type ConnectionShellProps = {
  viewer: HanakaiViewer | null;
  children: React.ReactNode;
  showNav?: boolean;
  /** LPなど hero をフルブリード表示するページ向け */
  flushMain?: boolean;
};

export function ConnectionShell({ viewer, children, showNav = true, flushMain = false }: ConnectionShellProps) {
  return (
    <div className={CONNECTION_SHELL_CLASS}>
      <header className='sticky top-0 z-20 border-b border-[#ebe9e4] bg-[#fafaf8]/95 px-5 py-4 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex flex-col'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </Link>
          <div className='flex items-center gap-2'>
            {viewer ? (
              <HeaderUserMenu user={viewer} />
            ) : (
              <>
                <Link href='/login' className='rounded-full border border-[#d8d6d1] px-3 py-1.5 text-xs font-medium text-[#6b6b6b]'>
                  ログイン
                </Link>
                <Link href='/events' className='rounded-full bg-[#1f5d4f] px-3 py-1.5 text-xs font-medium text-white'>
                  イベントを見る
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 ${flushMain ? 'px-5 pb-8 pt-0 lg:px-10' : 'px-5 py-6 lg:px-10'} ${showNav ? 'pb-24' : ''}`}>{children}</main>

      <footer className={`border-t border-[#ebe9e4] px-5 py-6 text-center text-[11px] text-[#9a9a9a] ${showNav ? 'mb-16' : ''}`}>
        <p className='mb-1 font-medium tracking-[0.12em] text-[#1a1a1a]'>HANAKAI Connection</p>
        <p>知らない人同士がリアルで出会う、週替わりのイベントコミュニティ。</p>
        <div className='mt-3'>
          <LegalLinks className='text-[#9a9a9a]' />
        </div>
        {viewer?.isConnectionAdmin ? (
          <p className='mt-2'>
            <Link href='/manage' className='text-[#9a9a9a] underline-offset-2 hover:underline'>
              運営
            </Link>
          </p>
        ) : null}
      </footer>

      {showNav ? <ConnectionBottomNav /> : null}
    </div>
  );
}
