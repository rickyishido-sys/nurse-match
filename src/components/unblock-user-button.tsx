'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unblockUserAction } from '@/lib/actions';

type UnblockUserButtonProps = {
  blockerUserId: string;
  blockedUserId: string;
};

export function UnblockUserButton({ blockerUserId, blockedUserId }: UnblockUserButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type='button'
      disabled={isPending}
      onClick={() => {
        const ok = window.confirm('ブロックを解除しますか？再び候補や会話に表示される可能性があります。');
        if (!ok) return;
        startTransition(async () => {
          const form = new FormData();
          form.set('blockerUserId', blockerUserId);
          form.set('blockedUserId', blockedUserId);
          await unblockUserAction(form);
          router.refresh();
        });
      }}
      className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50'
    >
      ブロック解除
    </button>
  );
}
