import { redirect } from 'next/navigation';
import { loginAction } from '@/lib/actions';
import { BrandAuthFrame, BrandAuthLinks } from '@/components/connection/brand/brand-auth-frame';
import { ctaPrimaryFull } from '@/components/connection/ui/cta-classes';
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
    const next = pickFirst(params.next);
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : null;
    redirect(safeNext ?? '/home');
  }

  const error = pickFirst(params.error);
  const detail = safeDecode(pickFirst(params.detail));
  const next = pickFirst(params.next);

  return (
    <BrandAuthFrame title='おかえりなさい' subtitle='パスワードでログインしてください' characterId='E1'>
      {error === 'under-review' ? (
        <div className='mb-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-5 text-amber-700'>
          <p>現在、審査中のためログインできません。審査完了後にログインできます。</p>
        </div>
      ) : null}
      {error === 'invalid-credentials' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          <p>メールアドレスまたはパスワードが正しくありません。もう一度お試しください。</p>
        </div>
      ) : null}
      {error === 'account-deleted' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          <p>このアカウントは退会済みのため、ログインできません。</p>
        </div>
      ) : null}
      {error === 'config' || error === 'session-missing' || error === 'user-row-missing' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          <p>ログイン処理でエラーが発生しました。時間をおいて再度お試しください。</p>
        </div>
      ) : null}
      {error === 'auth-callback' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          <p>認証に失敗しました。もう一度お試しください。</p>
          {detail ? <p className='mt-1 break-all text-[11px]'>detail: {detail}</p> : null}
        </div>
      ) : null}

      <form action={loginAction} className='space-y-4'>
        {next ? <input type='hidden' name='next' value={next} /> : null}
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium text-[#6b6b6b]'>メールアドレス</span>
          <input
            type='email'
            name='email'
            required
            placeholder='email@example.com'
            className='min-h-[44px] w-full rounded-2xl border border-[#e8e4dc] bg-white/80 px-4 py-3 text-sm text-[#1a1a1a] outline-none backdrop-blur transition focus:border-[#1f5d4f] focus:ring-4 focus:ring-[#1f5d4f]/10'
          />
        </label>
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium text-[#6b6b6b]'>パスワード</span>
          <input
            type='password'
            name='password'
            required
            placeholder='password'
            className='min-h-[44px] w-full rounded-2xl border border-[#e8e4dc] bg-white/80 px-4 py-3 text-sm text-[#1a1a1a] outline-none backdrop-blur transition focus:border-[#1f5d4f] focus:ring-4 focus:ring-[#1f5d4f]/10'
          />
        </label>
        <p className='text-right'>
          <a href='/forgot-password' className='text-xs font-medium text-[#1f5d4f] underline-offset-2 hover:underline'>
            パスワードをお忘れの方
          </a>
        </p>
        <button type='submit' className={`hk-brand-btn min-h-[44px] ${ctaPrimaryFull}`}>
          ログイン
        </button>
      </form>

      <BrandAuthLinks />
    </BrandAuthFrame>
  );
}
