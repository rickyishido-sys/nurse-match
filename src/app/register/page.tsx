import Link from 'next/link';
import { RegisterEmailForm } from '@/components/register-email-form';

type RegisterPageProps = {
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

function resolveRegisterErrorMessage(error: string, detail: string) {
  if (error === 'duplicate-email') {
    return 'このメールアドレスはすでに登録されています。ログインしてください。';
  }
  if (error === 'email-required') {
    return 'メールアドレスを入力してください。';
  }
  if (error === 'config') {
    return '認証設定の読み込みに失敗しました。時間をおいて再度お試しください。';
  }
  if (error === 'session_not_found') {
    return '認証セッションの確認に時間がかかっています。少し時間をおいてもう一度お試しください。';
  }
  if (error === 'auth-callback') {
    if (detail.includes('exchange_failed') || detail.includes('verify_failed')) {
      return '認証リンクの確認に失敗しました。もう一度メールのリンクをお試しください。';
    }
    return '認証リンクの有効期限切れ、またはブラウザ引き継ぎに失敗しました。再度メール認証をお試しください。';
  }
  if (error === 'send-failed' || error === 'supabase') {
    const text = detail.toLowerCase();
    if (text.includes('rate limit') || text.includes('too many') || text.includes('over_email_send_rate_limit')) {
      return '短時間に複数回送信されたため、少し時間をおいて再度お試しください。';
    }
    return '認証リンク送信に失敗しました。時間をおいて再度お試しください。';
  }
  return '';
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const sent = pickFirst(params.sent);
  const error = pickFirst(params.error);
  const detail = safeDecode(pickFirst(params.detail));
  const sentEmail = safeDecode(pickFirst(params.sentEmail));
  const burst = true;
  const errorMessage = resolveRegisterErrorMessage(error, detail);

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eef5ea_0%,_#fbeef0_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-[32px] border border-[#e3ece0] bg-white/95 p-6 shadow-[0_16px_45px_-35px_rgba(63,107,59,0.3)] backdrop-blur-sm sm:p-7'>
          <div className='mb-6 flex flex-col items-center'>
            <span className='text-2xl font-bold tracking-[0.18em] text-[#3f6b3b]'>HANAKAI</span>
            <span className='text-sm font-medium text-[#caa66a]'>花会</span>
          </div>

          <h1 className='mb-1 text-center text-2xl font-bold tracking-tight text-slate-900'>花会をはじめる</h1>
          <p className='mb-6 text-center text-sm text-slate-600'>まずはメール認証から始めます</p>

          {sent === '1' ? (
            <p className='mb-4 rounded-2xl border border-[#d8e2d3] bg-[#eef4ea] px-4 py-3 text-xs leading-5 text-[#4f7a4a]'>
              認証メールを送信しました。メール内の「Sign in」を押してください。
              {sentEmail ? <span className='mt-1 block break-all text-[11px]'>送信先: {sentEmail}</span> : null}
            </p>
          ) : null}
          {errorMessage ? (
            <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
              <p>{errorMessage}</p>
              {error === 'duplicate-email' ? (
                <Link href='/login' className='mt-1 inline-block font-semibold underline underline-offset-2'>
                  ログインする
                </Link>
              ) : null}
            </div>
          ) : null}

          <RegisterEmailForm sent={sent === '1'} allowBurst={burst} />

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
