import Link from 'next/link';
import { BrandAuthFrame } from '@/components/connection/brand/brand-auth-frame';

export const metadata = {
  title: 'メール送信完了',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordSentPage() {
  return (
    <BrandAuthFrame title='メールを送信しました' subtitle='届いたリンクから新しいパスワードを設定してください' characterId='E1'>
      <div className='space-y-4 rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-4 text-sm leading-7 text-[#1f5d4f]'>
        <p>ご入力いただいたメールアドレス宛に、パスワード再設定用のリンクを送信しました（登録がない場合も同じ画面が表示されます）。</p>
        <p className='text-xs text-[#4a6b5f]'>リンクの有効期限が切れた場合は、もう一度お試しください。</p>
      </div>
      <div className='mt-6 flex flex-col gap-3'>
        <Link
          href='/forgot-password'
          className='flex min-h-[44px] items-center justify-center rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b]'
        >
          もう一度送信する
        </Link>
        <Link
          href='/login'
          className='flex min-h-[44px] items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
        >
          ログインに戻る
        </Link>
      </div>
    </BrandAuthFrame>
  );
}
