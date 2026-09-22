import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminCard, AdminPageHeader } from '@/components/admin/ui';
import { HanakaiAdminForbidden } from '@/components/admin/hanakai/hanakai-admin-forbidden';
import { HanakaiAdminNav } from '@/components/admin/hanakai/hanakai-admin-nav';
import { HeaderUserMenu } from '@/components/connection/header-user-menu';
import { HANAKAI_ADMIN_FEATURE_LINKS } from '@/lib/connection/hanakai-admin-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export const metadata = {
  title: 'HANAKAI 管理画面',
  robots: { index: false, follow: false },
};

export default async function HanakaiAdminTopPage() {
  const viewer = await getHanakaiViewer();
  if (!viewer) {
    redirect('/admin/login');
  }
  if (viewer.role !== 'super_admin') {
    return (
      <div className='min-h-screen bg-[#f7f5f0] text-[#1a1a1a]'>
        <main className='mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8'>
          <HanakaiAdminForbidden reason='not_admin' />
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
            <div className='flex shrink-0 items-center gap-2'>
              <Link
                href='/home'
                className='rounded-full border border-[#e2ddd2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#6b6b6b] transition hover:text-[#1a1a1a]'
              >
                サービスへ戻る
              </Link>
              <HeaderUserMenu user={viewer} />
            </div>
          </div>
          <div className='mt-3'>
            <HanakaiAdminNav />
          </div>
        </div>
      </header>

      <main className='mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8'>
        <div className='space-y-8'>
          <AdminPageHeader
            kicker='ADMIN HOME'
            title='HANAKAI 管理画面'
            description='実装済みの運営機能へ移動できます。'
          />
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {HANAKAI_ADMIN_FEATURE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className='block h-full'>
                <AdminCard className='h-full transition hover:border-[#cfe3da] hover:shadow-[0_8px_24px_rgba(31,93,79,0.08)]'>
                  <p className='text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
                  <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{item.description}</p>
                  <p className='mt-4 text-xs font-medium text-[#1f5d4f]'>開く →</p>
                </AdminCard>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
