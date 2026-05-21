import Link from 'next/link';
import { loginAction } from '@/lib/actions';

export default async function LoginPage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[390px] items-center bg-white px-4 py-8'>
      <section className='w-full rounded-3xl border border-slate-100 bg-white p-5 shadow-lg'>
        <div className='mb-3 text-lg font-bold text-slate-900'>
          ナースマッチ
        </div>
        <h1 className='mb-1 text-xl font-bold'>登録済みの方</h1>
        <p className='mb-4 text-xs text-slate-500'>メールアドレスまたは携帯番号でログイン</p>

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
    </main>
  );
}
