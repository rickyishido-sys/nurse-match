import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { loginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

function loginLandingPath(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.role === 'female_admin') return '/admin/female';
  if (user.role === 'male_admin') return '/admin/male';
  if (user.role === 'super_admin') return '/admin';
  if (user.onboardingStatus === 'provisional') return '/preview';
  if (user.onboardingStatus === 'profile_completed') return '/pending-review';
  return '/home';
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }
  if (user) redirect(loginLandingPath(user));

  return (
    <AppShell user={user}>
      <section className='rounded-3xl bg-white p-5 shadow-lg'>
        <div className='mb-3'>
          <Image
            src='/logo/nurse-match-logo-horizontal.png'
            alt='ナースマッチ ロゴ'
            width={320}
            height={100}
            className='h-10 w-auto object-contain'
          />
        </div>
        <h1 className='mb-1 text-xl font-bold'>登録済みの方</h1>
        <p className='mb-4 text-xs text-slate-500'>メールアドレスまたは携帯番号でログイン</p>

        <div className='mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs'>
          <span className='rounded-lg bg-white px-3 py-2 text-center font-semibold text-slate-900'>メール</span>
          <span className='rounded-lg px-3 py-2 text-center text-slate-500'>SMS（準備中）</span>
        </div>

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
          はじめての方はこちら
        </Link>
        <Link href='/admin/login' className='ml-3 mt-4 inline-block text-xs text-slate-600 underline'>
          管理者ログイン
        </Link>
      </section>
    </AppShell>
  );
}
