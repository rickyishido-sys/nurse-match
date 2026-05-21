import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { isAdminRole } from '@/lib/guard';
import { getCurrentUser } from '@/lib/data';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user && isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }
  if (user && user.role === 'user') redirect('/home');

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]'>
          <h1 className='text-xl font-bold text-slate-900'>はじめての方</h1>
          <p className='mt-1 text-sm text-slate-600'>まずは連絡先確認から始めます</p>
          <div className='mt-4 space-y-3'>
            <label className='grid gap-1 text-sm'>
              メールアドレス
              <input type='email' placeholder='email@example.com' className='h-11 rounded-xl border border-slate-200 px-3 text-slate-700' />
            </label>
            <p className='text-center text-xs text-slate-500'>または</p>
            <label className='grid gap-1 text-sm'>
              携帯番号
              <input type='tel' placeholder='09012345678' className='h-11 rounded-xl border border-slate-200 px-3 text-slate-700' />
            </label>
          </div>
          <Link
            href='/register/details'
            className='mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white'
          >
            連絡先確認へ進む
          </Link>
        </article>

        <article className='rounded-2xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-600 shadow-sm'>
          <p>すでに登録済みの方はこちら</p>
          <Link href='/login' className='mt-1 inline-block text-sm font-semibold text-slate-900 underline'>
            ログイン
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
