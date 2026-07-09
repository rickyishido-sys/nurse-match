'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { clearOnboardingProgress } from '@/lib/connection/onboarding-progress';

export default function RegisterProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('REGISTER_PROFILE_ERROR_BOUNDARY', {
      message: error.message,
      digest: error.digest ?? null,
    });
    try {
      clearOnboardingProgress();
    } catch {
      // noop
    }
  }, [error]);

  return (
    <main className='flex min-h-[60vh] items-center justify-center px-5 py-8'>
      <section className='w-full max-w-[420px] rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center sm:p-7'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>プロフィール画面の読み込みに失敗しました</p>
        <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
          通信状況や一時的な不具合の可能性があります。もう一度お試しください。
        </p>
        <div className='mt-5 flex flex-col gap-2'>
          <button
            type='button'
            onClick={reset}
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-5 text-sm font-semibold text-white'
          >
            再読み込み
          </button>
          <Link href='/register' className='inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] px-5 text-sm font-semibold text-[#1f5d4f]'>
            登録画面へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
