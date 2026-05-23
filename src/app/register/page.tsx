import Link from 'next/link';
import Image from 'next/image';
import { requestRegisterVerificationAction } from '@/lib/actions';

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const status = pickFirst(params.status);
  const error = pickFirst(params.error);
  const email = pickFirst(params.email);

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

          <h1 className='mb-1 text-center text-2xl font-bold tracking-tight text-slate-900'>はじめる</h1>
          <p className='mb-6 text-center text-sm text-slate-600'>まずは連絡先確認から始めます</p>

          {status === 'sent-email' ? (
            <p className='mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-700'>
              {email ? `${email} 宛に認証リンクを送信しました。` : '認証リンクを送信しました。'} メール内のリンクを開いて登録を続けてください。
            </p>
          ) : null}
          {status === 'sms-preparing' ? (
            <p className='mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700'>
              SMS認証は現在準備中です。先にメール認証をご利用ください。
            </p>
          ) : null}
          {error === 'contact-required' ? (
            <p className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              メールアドレスまたは携帯番号を入力してください。
            </p>
          ) : null}
          {error === 'duplicate-email' ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>このメールアドレスはすでに登録されています。ログインしてください。</p>
              <Link href='/login' className='mt-1 inline-block font-semibold underline underline-offset-2'>
                ログインする
              </Link>
            </div>
          ) : null}
          {error === 'duplicate-phone' ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>この電話番号はすでに登録されています。ログインしてください。</p>
              <Link href='/login' className='mt-1 inline-block font-semibold underline underline-offset-2'>
                ログインする
              </Link>
            </div>
          ) : null}
          {error === 'email-required' ? (
            <p className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              現在はメール認証を優先提供しています。メールアドレスを入力してください。
            </p>
          ) : null}
          {error === 'send-failed' || error === 'config' ? (
            <p className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              認証リンク送信に失敗しました。時間をおいて再度お試しください。
            </p>
          ) : null}

          <form action={requestRegisterVerificationAction} className='space-y-4'>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-medium text-slate-600'>メールアドレス</span>
              <input
                type='email'
                name='email'
                placeholder='email@example.com'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
              />
            </label>
            <p className='text-center text-xs text-slate-500'>または</p>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-medium text-slate-600'>携帯番号</span>
              <input
                type='tel'
                name='phone'
                placeholder='09012345678'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
              />
            </label>

            <button
              type='submit'
              name='method'
              value='email'
              className='w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
            >
              認証リンクを送る
            </button>
            <button
              type='submit'
              name='method'
              value='sms'
              className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500'
            >
              SMS認証コードを送る（準備中）
            </button>
          </form>

          <div className='mt-5 text-center text-xs text-slate-600'>
            登録済みの方はこちら{' '}
            <Link href='/login' className='font-medium text-slate-700 underline underline-offset-2'>
              ログイン
            </Link>
          </div>
          <div className='mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-500'>
            <Link href='/terms' className='underline underline-offset-2'>利用規約</Link>
            <Link href='/privacy' className='underline underline-offset-2'>プライバシー</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
