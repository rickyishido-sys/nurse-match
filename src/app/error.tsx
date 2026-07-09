'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ctaPrimary, ctaSecondary } from '@/components/connection/ui/cta-classes';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GLOBAL_ERROR', { message: error.message, digest: error.digest ?? null });
  }, [error]);

  return (
    <div className='min-h-screen bg-[#fafaf8] text-[#1a1a1a]'>
      <header className='border-b border-[#ebe9e4] bg-[#fafaf8]/95 px-5 py-4'>
        <Link href='/' className='flex flex-col'>
          <span className='text-[15px] font-semibold tracking-[0.12em]'>HANAKAI</span>
          <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
        </Link>
      </header>
      <main className='flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-5 py-10 text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3ef] text-2xl text-[#1f5d4f]'>
          ✿
        </div>
        <h1 className='mt-6 text-lg font-semibold tracking-tight'>問題が発生しました</h1>
        <p className='mx-auto mt-3 max-w-md text-sm leading-7 text-[#6b6b6b]'>
          ページの読み込み中にエラーが発生しました。しばらくしてからもう一度お試しください。
        </p>
        <div className='mt-8 flex flex-col items-center gap-3'>
          <button type='button' onClick={() => reset()} className={ctaPrimary}>
            もう一度試す
          </button>
          <Link href='/' className={ctaSecondary}>
            トップへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
