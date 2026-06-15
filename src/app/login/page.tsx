import Link from 'next/link';
import { loginAction } from '@/lib/actions';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function safeDecode(value: string) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = pickFirst(params.error);
  const detail = safeDecode(pickFirst(params.detail));

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eef5ea_0%,_#fbeef0_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-[32px] border border-[#e3ece0] bg-white/95 p-6 shadow-[0_16px_45px_-35px_rgba(63,107,59,0.3)] backdrop-blur-sm sm:p-7'>
          <div className='mb-6 flex flex-col items-center'>
            <span className='text-2xl font-bold tracking-[0.18em] text-[#3f6b3b]'>HANAKAI</span>
            <span className='text-sm font-medium text-[#caa66a]'>花会</span>
          </div>

          <h1 className='mb-1 text-center text-2xl font-bold tracking-tight text-slate-900'>おかえりなさい</h1>
          <p className='mb-6 text-center text-sm text-slate-600'>花会のアカウントでログイン</p>
          {error === 'under-review' ? (
            <div className='mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700'>
              <p>現在、審査中のためログインできません。審査完了後にログインできます。</p>
            </div>
          ) : null}
          {error === 'invalid-credentials' ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>メールアドレスまたはパスワードが正しくありません。もう一度お試しください。</p>
            </div>
          ) : null}
          {error === 'config' || error === 'session-missing' || error === 'user-row-missing' ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>ログイン処理でエラーが発生しました。時間をおいて再度お試しください。</p>
            </div>
          ) : null}
          {error === 'auth-callback' ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>認証コールバックに失敗しました。もう一度認証リンクを開いてください。</p>
              {detail ? <p className='mt-1 break-all text-[11px]'>detail: {detail}</p> : null}
            </div>
          ) : null}

          <form action={loginAction} className='space-y-4'>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-medium text-slate-600'>メールアドレス</span>
              <input
                type='email'
                name='email'
                required
                placeholder='email@example.com'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
              />
            </label>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-medium text-slate-600'>パスワード</span>
              <input
                type='password'
                name='password'
                required
                placeholder='password'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
              />
            </label>
            <button className='w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'>
              ログイン
            </button>
          </form>

          <div className='mt-5 flex items-center justify-center gap-4 text-xs'>
            <Link href='/register' className='font-medium text-slate-600 underline underline-offset-2'>
              はじめての方はこちら
            </Link>
            <Link href='/admin/login' className='font-medium text-slate-600 underline underline-offset-2'>
              管理者ログイン
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
