import Link from 'next/link';
import Image from 'next/image';
import { logoutAction, setDemoUserAction } from '@/lib/actions';
import { BottomNav } from '@/components/bottom-nav';
import { USE_MOCK_DATA } from '@/lib/config';
import { listUsers } from '@/lib/mock-data';
import type { AppUser } from '@/lib/types/domain';

type AppShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const showBottomNav = user !== null;
  const isAdmin = user?.role === 'female_admin' || user?.role === 'male_admin' || user?.role === 'super_admin';
  const adminHref = user?.role === 'female_admin' ? '/admin/female' : user?.role === 'male_admin' ? '/admin/male' : '/admin';

  return (
    <div className='safe-area-padding mx-auto flex min-h-screen w-full max-w-[390px] flex-col border-x border-slate-100/80 bg-white/90 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.45)] backdrop-blur'>
      <header className='sticky top-0 z-20 border-b border-slate-100/90 bg-white/95 px-4 py-3 backdrop-blur'>
        <div className='mb-2 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900'>
            <span className='relative h-[28px] w-[28px] overflow-hidden'>
              <Image src='/logo/nurse-match-mark.png' alt='ナースマッチ ロゴマーク' fill className='object-contain' />
            </span>
            <span>ナースマッチ</span>
          </Link>
          <div className='flex items-center gap-2'>
            {isAdmin ? (
              <Link href={adminHref} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                管理画面
              </Link>
            ) : (
              <Link href='/favorites' className='rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'>
                お気に入り
              </Link>
            )}
            {user ? (
              <form action={logoutAction}>
                <button className='rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white'>ログアウト</button>
              </form>
            ) : null}
          </div>
        </div>

        {USE_MOCK_DATA ? (
          <form action={setDemoUserAction} className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2'>
            <label htmlFor='demo-user' className='text-xs font-medium text-slate-600'>
              デモユーザー
            </label>
            <select
              id='demo-user'
              name='userId'
              defaultValue={user?.id}
              className='flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs'
            >
              {listUsers().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nickname} ({item.role}/{item.gender})
                </option>
              ))}
            </select>
            <button className='rounded-xl bg-slate-900 px-3 py-1 text-xs text-white'>切替</button>
          </form>
        ) : null}
      </header>

      <main className={`flex-1 px-4 py-4 ${showBottomNav ? 'pb-24' : ''}`}>{children}</main>

      <footer className={`border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500 ${showBottomNav ? 'mb-16' : ''}`}>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Link href='/terms' className='underline'>利用規約</Link>
          <Link href='/privacy' className='underline'>プライバシー</Link>
          <Link href='/community-guidelines' className='underline'>ガイドライン</Link>
        </div>
      </footer>

      {showBottomNav ? <BottomNav role={user?.role} /> : null}
    </div>
  );
}
