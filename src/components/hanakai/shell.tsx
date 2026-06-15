import Link from 'next/link';
import { HanakaiBottomNav } from '@/components/hanakai/bottom-nav';
import { logoutAction } from '@/lib/actions';
import type { HanakaiViewer } from '@/lib/hanakai/session';

type HanakaiShellProps = {
  viewer: HanakaiViewer | null;
  children: React.ReactNode;
  showNav?: boolean;
};

export function HanakaiShell({ viewer, children, showNav = true }: HanakaiShellProps) {
  return (
    <div className='mx-auto flex min-h-screen w-full max-w-[420px] flex-col border-x border-[#eef0ec] bg-[#fcfdfb]'>
      <header className='sticky top-0 z-20 border-b border-[#e7ede3] bg-white/90 px-4 py-3 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex items-baseline gap-1.5'>
            <span className='text-lg font-bold tracking-[0.18em] text-[#3f6b3b]'>HANAKAI</span>
            <span className='text-sm font-medium text-[#caa66a]'>花会</span>
          </Link>
          <div className='flex items-center gap-2'>
            {viewer ? (
              <form action={logoutAction}>
                <button className='rounded-full border border-[#e0e7db] px-3 py-1 text-xs font-semibold text-slate-600'>
                  ログアウト
                </button>
              </form>
            ) : (
              <>
                <Link href='/login' className='rounded-full border border-[#e0e7db] px-3 py-1 text-xs font-semibold text-slate-600'>
                  ログイン
                </Link>
                <Link href='/register' className='rounded-full bg-[#4f7a4a] px-3 py-1 text-xs font-semibold text-white'>
                  はじめる
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 px-4 py-4 ${showNav ? 'pb-24' : ''}`}>{children}</main>

      <footer className={`border-t border-[#eef0ec] px-4 py-4 text-center text-[11px] text-slate-400 ${showNav ? 'mb-16' : ''}`}>
        <p className='mb-1 font-semibold tracking-[0.18em] text-[#3f6b3b]'>HANAKAI ・ 花会</p>
        <p>リアル花会とデジタルコミュニティを循環させる、新しいつながりのかたち。</p>
        <div className='mt-2 flex flex-wrap items-center justify-center gap-3'>
          <Link href='/concept' className='underline'>花会28万人構想</Link>
          <Link href='/terms' className='underline'>利用規約</Link>
          <Link href='/privacy' className='underline'>プライバシー</Link>
        </div>
      </footer>

      {showNav ? <HanakaiBottomNav /> : null}
    </div>
  );
}
