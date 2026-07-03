import { redirect } from 'next/navigation';
import { HanakaiWordmark } from '@/components/hanakai/wordmark';
import { adminLoginAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';

export const metadata = {
  title: 'HANAKAI 管理コンソール',
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
  if (user?.role === 'female_admin') redirect('/admin/female');
  if (user?.role === 'male_admin') redirect('/admin/male');
  if (user?.role === 'super_admin') redirect('/admin');
  if (user) redirect('/home');

  const error = pickFirst(params.error);

  return (
    <main className='min-h-screen bg-[#f7f5f0] px-5 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-3xl border border-[#ebe7dd] bg-white p-6 shadow-[0_1px_8px_rgba(31,93,79,0.04)] sm:p-7'>
          <div className='mb-6 flex justify-center'>
            <HanakaiWordmark href='/' />
          </div>
          <h1 className='text-center text-xl font-semibold text-[#1a1a1a]'>HANAKAI 管理コンソール</h1>
          <p className='mt-1 text-center text-xs text-[#6b6b6b]'>HANAKAI運営スタッフ専用ページ</p>

          {error === 'invalid-credentials' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              メールアドレスまたはパスワードが正しくありません。
            </p>
          ) : null}
          {error === 'forbidden' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              管理者権限がありません。
            </p>
          ) : null}
          {error === 'user-row-missing' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              管理者ユーザー情報の取得に失敗しました。
            </p>
          ) : null}
          {error === 'session-missing' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              ログインセッションが作成されませんでした。
            </p>
          ) : null}
          {error === 'config-missing' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              サーバー設定が不足しています。
            </p>
          ) : null}
          {error === 'unexpected' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
              予期しないエラーが発生しました。時間をおいて再度お試しください。
            </p>
          ) : null}

          <form action={adminLoginAction} className='mt-5 space-y-3'>
            <input
              type='email'
              name='email'
              required
              placeholder='admin@hanakai.kranz.design'
              className='h-11 w-full rounded-xl border border-[#e2ddd2] px-3 text-sm'
            />
            <input
              type='password'
              name='password'
              required
              placeholder='password'
              className='h-11 w-full rounded-xl border border-[#e2ddd2] px-3 text-sm'
            />
            <button className='h-11 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'>
              管理画面へログイン
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
