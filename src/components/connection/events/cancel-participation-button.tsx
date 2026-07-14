'use client';

import { useState } from 'react';
import { cancelParticipationAction } from '@/lib/connection/v1-actions';

type CancelParticipationButtonProps = {
  eventId: string;
  eventTitle: string;
  returnTo: string;
};

export function CancelParticipationButton({ eventId, eventTitle, returnTo }: CancelParticipationButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='min-h-[44px] w-full rounded-full border border-rose-200 bg-white text-sm font-semibold text-rose-700 transition hover:bg-rose-50'
      >
        参加をキャンセル
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setSubmitting(true);
        try {
          await cancelParticipationAction(fd);
        } finally {
          setSubmitting(false);
        }
      }}
      className='rounded-2xl border border-rose-100 bg-rose-50/60 p-4'
    >
      <input type='hidden' name='eventId' value={eventId} />
      <input type='hidden' name='returnTo' value={returnTo} />
      <p className='text-sm font-semibold text-[#1a1a1a]'>「{eventTitle}」の参加をキャンセルしますか？</p>
      <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>キャンセル後は再度申し込みが必要な場合があります。イベント開始後はアプリからキャンセルできません。</p>
      <label className='mt-3 block'>
        <span className='mb-1 block text-[11px] text-[#9a9a9a]'>キャンセル理由（任意）</span>
        <textarea
          name='cancelReason'
          rows={2}
          maxLength={300}
          className='w-full rounded-xl border border-[#ebe9e4] bg-white px-3 py-2 text-xs outline-none focus:border-[#1f5d4f]'
          placeholder='例：予定が重なったため'
        />
      </label>
      <div className='mt-3 flex gap-2'>
        <button type='button' onClick={() => setOpen(false)} className='min-h-[44px] flex-1 rounded-full border border-[#d8d6d1] text-xs font-semibold text-[#6b6b6b]'>
          戻る
        </button>
        <button type='submit' disabled={submitting} className='min-h-[44px] flex-1 rounded-full bg-rose-700 text-xs font-semibold text-white disabled:opacity-60'>
          {submitting ? '処理中…' : 'キャンセルする'}
        </button>
      </div>
    </form>
  );
}
