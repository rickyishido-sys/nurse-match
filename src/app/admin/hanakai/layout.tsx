import Link from 'next/link';
import { HanakaiAdminNav } from '@/components/admin/hanakai/hanakai-admin-nav';
import { HanakaiAdminForbidden } from '@/components/admin/hanakai/hanakai-admin-forbidden';
import { getHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';

export const metadata = {
  title: 'HANAKAI 運営管理',
  robots: { index: false, follow: false },
};

export default async function HanakaiAdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getHanakaiAdminAccess();

  if (!access.allowed) {
    return (
      <div className='min-h-screen bg-[#f7f5f0] text-[#1a1a1a]'>
        <header className='border-b border-[#ebe7dd] bg-[#f7f5f0]'>
          <div className='mx-auto w-full max-w-[1180px] px-4 py-4 md:px-8'>
            <p className='text-[11px] font-semibold tracking-[0.2em] text-[#1f5d4f]'>HANAKAI ADMIN</p>
            <p className='text-sm font-semibold text-[#1a1a1a]'>運営管理コンソール</p>
          </div>
        </header>
        <main className='mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8'>
          <HanakaiAdminForbidden reason={access.reason === 'ok' ? 'not_admin' : access.reason} />
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f5f0] text-[#1a1a1a]'>
      <header className='sticky top-0 z-20 border-b border-[#ebe7dd] bg-[#f7f5f0]/95 backdrop-blur'>
        <div className='mx-auto w-full max-w-[1180px] px-4 py-3 md:px-8'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-[11px] font-semibold tracking-[0.2em] text-[#1f5d4f]'>HANAKAI ADMIN</p>
              <p className='text-sm font-semibold text-[#1a1a1a]'>運営管理コンソール</p>
            </div>
            <Link
              href='/home'
              className='rounded-full border border-[#e2ddd2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#6b6b6b] transition hover:text-[#1a1a1a]'
            >
              サービスへ戻る
            </Link>
          </div>
          <div className='mt-3'>
            <HanakaiAdminNav />
          </div>
        </div>
      </header>

      <main className='mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8'>{children}</main>

      <footer className='mx-auto w-full max-w-[1180px] px-4 pb-10 pt-4 md:px-8'>
        <p className='text-[11px] leading-6 text-[#9a9a9a]'>
          HANAKAI Connection 運営管理 Phase 2 — 参加申請処理・会員詳細・通報 inbox
        </p>
      </footer>
    </div>
  );
}
