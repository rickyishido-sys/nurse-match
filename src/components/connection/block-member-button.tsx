'use client';

import { useRef, useState, useTransition } from 'react';
import { blockMemberAction } from '@/lib/connection/block-actions';

type BlockMemberButtonProps = {
  blockedMemberId: string;
  memberName: string;
  returnTo: string;
};

type Phase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

const ERROR_MESSAGE: Record<string, string> = {
  login_required: 'ログインが必要です。',
  missing_target: 'ブロック対象が無効です。',
  block_failed: 'ブロックに失敗しました。時間をおいて再度お試しください。',
};

function withBlockedQuery(returnTo: string): string {
  const sep = returnTo.includes('?') ? '&' : '?';
  return `${returnTo}${sep}blocked=1`;
}

export function BlockMemberButton({ blockedMemberId, memberName, returnTo }: BlockMemberButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = useRef(false);

  if (phase === 'idle') {
    return (
      <button
        type='button'
        onClick={() => {
          setError(null);
          setPhase('confirm');
        }}
        className='min-h-[44px] rounded-full border border-[#ebe9e4] px-4 py-2.5 text-xs font-semibold text-[#6b6b6b] transition hover:border-[#d8d6d1]'
      >
        ブロックする
      </button>
    );
  }

  if (phase === 'success') {
    return (
      <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] p-4' role='status' aria-live='polite'>
        <p className='text-sm font-semibold text-[#1f5d4f]'>ブロックしました</p>
        <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>参加者一覧へ戻ります…</p>
      </div>
    );
  }

  const busy = phase === 'pending' || pending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (locked.current || busy) return;
        locked.current = true;
        setError(null);
        setPhase('pending');

        const fd = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            const result = await blockMemberAction(fd);
            if (!result.ok) {
              locked.current = false;
              setPhase('error');
              setError(ERROR_MESSAGE[result.error] ?? ERROR_MESSAGE.block_failed);
              if (result.error === 'login_required' && result.loginNext) {
                window.location.assign(result.loginNext);
              }
              return;
            }

            setPhase('success');
            // Hard navigation: soft redirect has been unreliable on iPhone WebKit/Capacitor.
            window.setTimeout(() => {
              window.location.assign(withBlockedQuery(result.returnTo));
            }, 500);
          } catch {
            locked.current = false;
            setPhase('error');
            setError(ERROR_MESSAGE.block_failed);
          }
        });
      }}
      className='rounded-2xl border border-rose-100 bg-rose-50/60 p-4'
    >
      <input type='hidden' name='blockedMemberId' value={blockedMemberId} />
      <input type='hidden' name='returnTo' value={returnTo} />
      <p className='text-xs leading-6 text-[#4a4a4a]'>
        <strong>{memberName}</strong>さんをブロックしますか？ブロックすると、この方のプロフィールや交流導線が表示されなくなります。相手への通知はありません。
      </p>
      {error ? (
        <p className='mt-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700' role='alert'>
          {error}
        </p>
      ) : null}
      <div className='mt-3 flex gap-2'>
        <button
          type='button'
          disabled={busy}
          onClick={() => {
            if (busy) return;
            setError(null);
            setPhase('idle');
          }}
          className='min-h-[44px] flex-1 rounded-full border border-[#d8d6d1] text-xs font-semibold text-[#6b6b6b] disabled:opacity-60'
        >
          キャンセル
        </button>
        <button
          type='submit'
          disabled={busy}
          aria-busy={busy}
          className='min-h-[44px] flex-1 rounded-full bg-rose-700 text-xs font-semibold text-white disabled:opacity-60'
        >
          {busy ? 'ブロックしています…' : 'ブロックする'}
        </button>
      </div>
    </form>
  );
}
