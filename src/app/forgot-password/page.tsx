import Link from 'next/link';
import { BrandAuthFrame } from '@/components/connection/brand/brand-auth-frame';
import { ForgotPasswordForm } from '@/components/connection/auth/forgot-password-form';

export const metadata = {
  title: 'パスワード再設定',
  robots: { index: false, follow: false },
};

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === 'string' ? params.error : '';

  return (
    <BrandAuthFrame title='パスワードをお忘れですか？' subtitle='登録メールアドレスに再設定用リンクをお送りします' characterId='E1'>
      {error === 'invalid_email' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          有効なメールアドレスを入力してください。
        </div>
      ) : null}
      <ForgotPasswordForm />
      <p className='mt-4 text-center text-xs leading-6 text-[#9a9a9a]'>
        登録済みのメールアドレスかどうかは表示しません。届かない場合は迷惑メールフォルダをご確認ください。
      </p>
      <p className='mt-6 text-center'>
        <Link href='/login' className='text-sm font-medium text-[#1f5d4f] underline-offset-2 hover:underline'>
          ログインに戻る
        </Link>
      </p>
    </BrandAuthFrame>
  );
}
