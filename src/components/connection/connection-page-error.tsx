'use client';

import Link from 'next/link';

type ConnectionPageErrorProps = {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: boolean;
};

export function ConnectionPageError({
  title = 'ページを表示できませんでした',
  message,
  actionHref = '/events',
  actionLabel = 'イベント一覧へ戻る',
  onRetry = false,
}: ConnectionPageErrorProps) {
  return (
    <div className='mx-auto max-w-md space-y-6 py-10 text-center'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3ef] text-2xl text-[#1f5d4f]'>
        ✿
      </div>
      <div className='space-y-2'>
        <p className='text-sm font-semibold tracking-wide text-[#1a1a1a]'>{title}</p>
        <p className='text-xs leading-7 text-[#6b6b6b]'>{message}</p>
      </div>
      <div className='flex flex-col items-center gap-3'>
        {onRetry ? (
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white'
          >
            もう一度試す
          </button>
        ) : null}
        <Link
          href={actionHref}
          className='inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] px-6 text-sm font-semibold text-[#1f5d4f]'
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
