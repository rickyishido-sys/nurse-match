import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { loginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === 'female_admin') redirect('/admin/female');
  if (user?.role === 'male_admin') redirect('/admin/male');
  if (user?.role === 'super_admin') redirect('/admin');
  if (user) redirect('/home');

  return (
    <AppShell user={user}>
      <section className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <div className='mb-3'>
          <Image
            src='/logo/nurse-match-logo-horizontal.png'
            alt='ナースマッチ ロゴ'
            width={320}
            height={100}
            className='h-10 w-auto object-contain'
          />
        </div>
        <h1 className='text-xl font-bold text-slate-900'>管理者ログイン</h1>
        <p className='mt-1 text-xs text-slate-500'>female_admin / male_admin / super_admin 専用</p>
        <form action={loginAction} className='mt-4 space-y-3'>
          <input type='email' name='email' required placeholder='admin email' className='h-11 w-full rounded-xl border border-slate-200 px-3 text-sm' />
          <input type='password' name='password' required placeholder='password' className='h-11 w-full rounded-xl border border-slate-200 px-3 text-sm' />
          <button className='h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white'>ログイン</button>
        </form>
      </section>
    </AppShell>
  );
}
