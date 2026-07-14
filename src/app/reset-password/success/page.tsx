import Link from 'next/link';
import { BrandAuthFrame } from '@/components/connection/brand/brand-auth-frame';

export const metadata = {
  title: 'パスワード更新完了',
  robots: { index: false, follow: false },
};

export default function ResetPasswordSuccessPage() {
  return (
    <BrandAuthFrame title='パスワードを更新しました' subtitle='新しいパスワードでログインできます' characterId='E1'>
      <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-4 text-sm leading-7 text-[#1f5d4f]'>
        パスワードの更新が完了しました。セキュリティのため、他の端末では再度ログインが必要になる場合があります。
      </div>
      <Link
        href='/login'
        className='mt-6 flex min-h-[44px] items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
      >
        ログインへ
      </Link>
    </BrandAuthFrame>
  );
}
