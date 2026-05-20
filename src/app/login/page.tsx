import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { loginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';

export default async function LoginPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='rounded-3xl bg-white p-5 shadow-lg'>
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
