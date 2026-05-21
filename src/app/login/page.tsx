import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { loginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }
  if (user) redirect('/home');

  return (
    <AppShell user={user}>
      <section className='rounded-3xl bg-white p-5 shadow-lg'>
        <div className='mb-3 flex items-center gap-2'>
          <div className='relative h-8 w-8 overflow-hidden rounded-full border border-slate-200'>
            <Image src='/logo/nurse-match-logo.png' alt='ナースマッチ ロゴ' fill className='object-cover' />
          </div>
          <p className='text-sm font-semibold text-slate-700'>ナースマッチ</p>
        </div>
        <h1 className='mb-1 text-xl font-bold'>ログイン</h1>
        <p className='mb-4 text-xs text-slate-500'>Supabase Auth (email/password)</p>

        <form action={loginAction} className='space-y-3'>
          <input
            type='email'
            name='email'
            required
            placeholder='email@example.com'
            className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
          />
          <input
            type='password'
            name='password'
            required
            placeholder='password'
            className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
          />
          <button className='w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white'>
            ログイン
          </button>
        </form>

        <Link href='/register' className='mt-4 inline-block text-xs text-slate-600 underline'>
          新規登録はこちら
        </Link>
        <Link href='/admin/login' className='ml-3 mt-4 inline-block text-xs text-slate-600 underline'>
          管理者ログイン
        </Link>
      </section>
    </AppShell>
  );
}
