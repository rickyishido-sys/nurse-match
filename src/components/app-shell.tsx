import Link from 'next/link';
import { setDemoUserAction } from '@/lib/actions';
import { BottomNav } from '@/components/bottom-nav';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { HanakaiWordmark } from '@/components/hanakai/wordmark';
import { USE_MOCK_DATA } from '@/lib/config';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { listUsers } from '@/lib/mock-data';
import type { AppUser } from '@/lib/types/domain';
import { headers } from 'next/headers';

type AppShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export async function AppShell({ user, children }: AppShellProps) {
  const showBottomNav = user !== null;
  const isAdmin = user?.role === 'female_admin' || user?.role === 'male_admin' || user?.role === 'super_admin';
  const adminHref = user?.role === 'female_admin' ? '/admin/female' : user?.role === 'male_admin' ? '/admin/male' : '/admin';
  const headerViewer = await getHanakaiViewer();
  const headerStore = await headers();
  const host = (headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? '').toLowerCase();
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1');
  const showDemoSwitcher = USE_MOCK_DATA && process.env.NODE_ENV === 'development' && isLocalhost;

  return (
    <div className='safe-area-padding mx-auto flex min-h-screen w-full max-w-[390px] flex-col border-x border-[#ebe9e4]/80 bg-[#fafaf8] shadow-[0_24px_70px_-30px_rgba(31,93,79,0.12)]'>
      <header className='sticky top-0 z-20 border-b border-[#ebe9e4] bg-[#fafaf8]/95 px-4 py-3 backdrop-blur'>
        <div className='mb-2 flex items-center justify-between'>
          <HanakaiWordmark compact href='/home' />
          <div className='flex items-center gap-2'>
            {isAdmin ? (
              <Link
                href={adminHref}
                className='rounded-full border border-[#e2ddd2] px-3 py-1 text-xs font-semibold text-[#6b6b6b]'
              >
                管理画面
              </Link>
            ) : (
              <Link href='/events' className='rounded-full border border-[#e2ddd2] px-3 py-1 text-xs font-semibold text-[#6b6b6b]'>
                イベント
              </Link>
            )}
            {headerViewer ? <HeaderUserMenu user={headerViewer} /> : null}
          </div>
        </div>

        {showDemoSwitcher ? (
          <form action={setDemoUserAction} className='flex items-center gap-2 rounded-2xl border border-[#e2ddd2] bg-[#f5f3ee] p-2'>
            <label htmlFor='demo-user' className='text-xs font-medium text-[#6b6b6b]'>
              デモユーザー
            </label>
            <select
              id='demo-user'
              name='userId'
              defaultValue={user?.id}
              className='flex-1 rounded-xl border border-[#e2ddd2] bg-white px-2 py-1 text-xs'
            >
              {listUsers().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nickname} ({item.role}/{item.gender})
                </option>
              ))}
            </select>
            <button className='rounded-xl bg-[#1f5d4f] px-3 py-1 text-xs text-white'>切替</button>
          </form>
        ) : null}
      </header>

      <main className={`flex-1 px-4 py-4 ${showBottomNav ? 'pb-24' : ''}`}>{children}</main>

      <footer className={`border-t border-[#ebe9e4] px-4 py-3 text-center text-xs text-[#9a9a9a] ${showBottomNav ? 'mb-16' : ''}`}>
        <div className='mb-2 flex justify-center'>
          <HanakaiWordmark href='/home' />
        </div>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Link href='/terms' className='underline'>
            利用規約
          </Link>
          <Link href='/privacy' className='underline'>
            プライバシー
          </Link>
          <Link href='/community-guidelines' className='underline'>
            ガイドライン
          </Link>
        </div>
      </footer>

      {showBottomNav ? <BottomNav role={user?.role} /> : null}
    </div>
  );
}
