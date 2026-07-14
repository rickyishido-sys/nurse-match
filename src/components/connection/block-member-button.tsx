'use client';

import { useState } from 'react';
import { blockMemberAction } from '@/lib/connection/block-actions';

type BlockMemberButtonProps = {
  blockedMemberId: string;
  memberName: string;
  returnTo: string;
};

export function BlockMemberButton({ blockedMemberId, memberName, returnTo }: BlockMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='min-h-[44px] rounded-full border border-[#ebe9e4] px-4 py-2.5 text-xs font-semibold text-[#6b6b6b] transition hover:border-[#d8d6d1]'
      >
        ブロックする
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setSubmitting(true);
        try {
          await blockMemberAction(fd);
        } finally {
          setSubmitting(false);
        }
      }}
      className='rounded-2xl border border-rose-100 bg-rose-50/60 p-4'
    >
      <input type='hidden' name='blockedMemberId' value={blockedMemberId} />
      <input type='hidden' name='returnTo' value={returnTo} />
      <p className='text-xs leading-6 text-[#4a4a4a]'>
        <strong>{memberName}</strong>さんをブロックしますか？ブロックすると、この方のプロフィールや交流導線が表示されなくなります。相手への通知はありません。
      </p>
      <div className='mt-3 flex gap-2'>
        <button
          type='button'
          onClick={() => setOpen(false)}
          className='min-h-[44px] flex-1 rounded-full border border-[#d8d6d1] text-xs font-semibold text-[#6b6b6b]'
        >
          キャンセル
        </button>
        <button
          type='submit'
          disabled={submitting}
          className='min-h-[44px] flex-1 rounded-full bg-rose-700 text-xs font-semibold text-white disabled:opacity-60'
        >
          {submitting ? '処理中…' : 'ブロックする'}
        </button>
      </div>
    </form>
  );
}
