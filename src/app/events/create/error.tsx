'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ConnectionPageError } from '@/components/connection/connection-page-error';

export default function CreateEventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('EVENTS_CREATE_PAGE_ERROR', {
      message: error.message,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <div className='min-h-screen bg-[#fafaf8] text-[#1a1a1a]'>
      <header className='border-b border-[#ebe9e4] bg-[#fafaf8]/95 px-5 py-4'>
        <Link href='/' className='flex flex-col'>
          <span className='text-[15px] font-semibold tracking-[0.12em]'>HANAKAI</span>
          <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
        </Link>
      </header>
      <main className='px-5 py-6'>
        <ConnectionPageError
          message='イベント作成ページの読み込み中に問題が発生しました。しばらくしてからもう一度お試しください。'
          actionHref='/events'
          actionLabel='イベント一覧へ戻る'
        />
        <div className='mt-4 text-center'>
          <button
            type='button'
            onClick={() => reset()}
            className='text-xs font-medium text-[#1f5d4f] underline underline-offset-2'
          >
            再読み込み
          </button>
        </div>
      </main>
    </div>
  );
}
