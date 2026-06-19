import Link from 'next/link';
import { ConnectionBottomNav } from '@/components/connection/bottom-nav';
import { logoutAction } from '@/lib/actions';
import type { HanakaiViewer } from '@/lib/hanakai/session';

type ConnectionShellProps = {
  viewer: HanakaiViewer | null;
  children: React.ReactNode;
  showNav?: boolean;
};

export function ConnectionShell({ viewer, children, showNav = true }: ConnectionShellProps) {
  return (
    <div className='mx-auto flex min-h-screen w-full max-w-[420px] flex-col border-x border-[#ebe9e4] bg-[#fafaf8]'>
      <header className='sticky top-0 z-20 border-b border-[#ebe9e4] bg-[#fafaf8]/95 px-5 py-4 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex flex-col'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </Link>
          <div className='flex items-center gap-2'>
            {viewer ? (
              <form action={logoutAction}>
                <button className='rounded-full border border-[#d8d6d1] px-3 py-1.5 text-xs font-medium text-[#6b6b6b]'>
                  ログアウト
                </button>
              </form>
            ) : (
              <>
                <Link href='/login' className='rounded-full border border-[#d8d6d1] px-3 py-1.5 text-xs font-medium text-[#6b6b6b]'>
                  ログイン
                </Link>
                <Link href='/register' className='rounded-full bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-white'>
                  参加登録
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 px-5 py-6 ${showNav ? 'pb-24' : ''}`}>{children}</main>

      <footer className={`border-t border-[#ebe9e4] px-5 py-6 text-center text-[11px] text-[#9a9a9a] ${showNav ? 'mb-16' : ''}`}>
        <p className='mb-1 font-medium tracking-[0.12em] text-[#1a1a1a]'>HANAKAI Connection</p>
        <p>人と人との新しいConnectionを生み出す、リアル体験プラットフォーム。</p>
        <div className='mt-3 flex flex-wrap items-center justify-center gap-4'>
          <Link href='/terms' className='underline-offset-2 hover:underline'>利用規約</Link>
          <Link href='/privacy' className='underline-offset-2 hover:underline'>プライバシー</Link>
          <Link href='/manage' className='underline-offset-2 hover:underline text-[#9a9a9a]'>運営</Link>
        </div>
      </footer>

      {showNav ? <ConnectionBottomNav /> : null}
    </div>
  );
}
