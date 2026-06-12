import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { adminLoginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';

export const metadata = {
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const user = await getCurrentUser();
  if (user?.role === 'female_admin') {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/login', role: user.role, redirectTo: '/admin/female', queryName: 'already_admin' });
    redirect('/admin/female');
  }
  if (user?.role === 'male_admin') {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/login', role: user.role, redirectTo: '/admin/male', queryName: 'already_admin' });
    redirect('/admin/male');
  }
  if (user?.role === 'super_admin') {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/login', role: user.role, redirectTo: '/admin', queryName: 'already_admin' });
    redirect('/admin');
  }
  if (user) {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/login', role: user.role, redirectTo: '/home', queryName: 'non_admin_user' });
    redirect('/home');
  }
  const error = pickFirst(params.error);

  return (
    <AppShell user={user}>
      <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <div className='mb-3'>
          <Image
            src='/logo/nurse-match-logo-horizontal.png'
            alt='ナースマッチ ロゴ'
            width={320}
            height={100}
            className='h-10 w-auto object-contain'
          />
        </div>
        <h1 className='text-xl font-bold text-slate-900'>管理者専用ログイン</h1>
        <p className='mt-1 text-xs text-slate-500'>一般ユーザー導線とは分離されています</p>
        {error === 'invalid-credentials' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>メールアドレスまたはパスワードが正しくありません。</p> : null}
        {error === 'forbidden' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>管理者権限がありません。</p> : null}
        {error === 'user-row-missing' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>管理者ユーザー情報の取得に失敗しました。</p> : null}
        {error === 'session-missing' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>ログインセッションが作成されませんでした。</p> : null}
        {error === 'config-missing' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>サーバー設定が不足しています。</p> : null}
        {error === 'unexpected' ? <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>予期しないエラーが発生しました。時間をおいて再度お試しください。</p> : null}
        <form action={adminLoginAction} className='mt-5 space-y-3'>
          <input type='email' name='email' required placeholder='admin@nursematch.app' className='h-11 w-full rounded-xl border border-slate-300 px-3 text-sm' />
          <input type='password' name='password' required placeholder='password' className='h-11 w-full rounded-xl border border-slate-300 px-3 text-sm' />
          <button className='h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white'>管理画面へログイン</button>
        </form>
      </section>
    </AppShell>
  );
}
