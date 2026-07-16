import Link from 'next/link';
import { IDENTITY_REQUIRED_PATH } from '@/lib/connection/identity-gate';

type Props = {
  laterHref?: string;
  className?: string;
};

export function IdentityRequiredPanel({ laterHref = '/my-profile', className = '' }: Props) {
  return (
    <div className={`rounded-3xl border border-[#e8dfd0] bg-[#fbf8f3] px-6 py-8 text-center sm:px-8 ${className}`}>
      <p className='text-lg font-semibold text-[#1a1a1a]'>本人確認が必要です</p>
      <p className='mx-auto mt-4 max-w-md text-sm leading-7 text-[#4a4a4a]'>
        HANAKAIでは、安心して人と会える環境を提供するため、イベントへの参加・イベント作成には本人確認が必要です。
      </p>
      <p className='mt-2 text-sm text-[#6b6b6b]'>本人確認は数分で完了します。</p>
      <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
        <Link
          href={IDENTITY_REQUIRED_PATH}
          className='inline-flex h-12 items-center justify-center rounded-full bg-[#1f5d4f] px-8 text-sm font-semibold text-white transition active:scale-[0.98]'
        >
          本人確認を開始する
        </Link>
        <Link
          href={laterHref}
          className='inline-flex h-12 items-center justify-center rounded-full border border-[#d8d6d1] bg-white px-8 text-sm font-semibold text-[#6b6b6b] transition active:scale-[0.98]'
        >
          あとで行う
        </Link>
      </div>
    </div>
  );
}
