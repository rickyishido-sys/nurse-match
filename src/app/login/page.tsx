import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginAction } from '@/lib/actions';
import { getHanakaiRegistrationStatus } from '@/lib/connection/registration-status';

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
  const registration = await getHanakaiRegistrationStatus();
  if (registration.isAuthenticated) {
    if (!registration.profileComplete) redirect('/register/profile');
    redirect('/home');
  }

  const error = pickFirst(params.error);
  const detail = safeDecode(pickFirst(params.detail));
  const next = pickFirst(params.next);

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-2xl border border-[#ebe9e4] bg-white p-6 sm:p-7'>
          <div className='mb-6 flex flex-col items-center'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </div>

          <h1 className='mb-1 text-center text-2xl font-semibold tracking-tight text-[#1a1a1a]'>おかえりなさい</h1>
          <p className='mb-6 text-center text-sm text-[#6b6b6b]'>パスワードでログインしてください</p>

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
              <p>認証に失敗しました。もう一度お試しください。</p>
              {detail ? <p className='mt-1 break-all text-[11px]'>detail: {detail}</p> : null}
            </div>
          ) : null}

          <form action={loginAction} className='space-y-4'>
            {next ? <input type='hidden' name='next' value={next} /> : null}
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

          <div className='mt-5 flex flex-col items-center gap-2 text-xs'>
            <Link href='/register' className='font-medium text-[#1f5d4f] underline underline-offset-2'>
              はじめての方は参加登録へ
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
