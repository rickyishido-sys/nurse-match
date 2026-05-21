import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/lib/actions';

export default async function LoginPage() {
  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-[32px] border border-sky-100/80 bg-white/95 p-6 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-7'>
          <div className='mb-6 flex justify-center'>
            <Image
              src='/logo/nurse-match-logo-horizontal.png'
              alt='ナースマッチ ロゴ'
              width={300}
              height={94}
              className='h-12 w-auto object-contain sm:h-14'
              priority
            />
          </div>

          <h1 className='mb-1 text-center text-2xl font-bold tracking-tight text-slate-900'>おかえりなさい</h1>
          <p className='mb-6 text-center text-sm text-slate-600'>登録済みの方はこちらからログイン</p>

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
