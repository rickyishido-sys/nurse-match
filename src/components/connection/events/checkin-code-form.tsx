'use client';

import { useState } from 'react';
import { participantCheckinAction } from '@/lib/connection/event-operations/actions';

type Props = {
  eventId: string;
  eventTitle: string;
  alreadyCheckedIn: boolean;
  error?: string | null;
};

export function CheckinCodeForm({ eventId, eventTitle, alreadyCheckedIn, error }: Props) {
  const [code, setCode] = useState('');

  if (alreadyCheckedIn) {
    return (
      <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-5 py-5 text-center'>
        <p className='text-sm font-semibold text-[#1f5d4f]'>チェックイン完了</p>
        <p className='mt-2 text-xs leading-6 text-[#5b6f67]'>ご参加ありがとうございます。素敵な時間をお過ごしください。</p>
      </div>
    );
  }

  return (
    <form action={participantCheckinAction} className='space-y-5'>
      <input type='hidden' name='eventId' value={eventId} />
      <p className='text-sm leading-7 text-[#4a4a4a]'>
        「{eventTitle}」に到着したら、会場でお伝えいただいた4桁コードを入力してください。
      </p>
      {error === 'code' ? (
        <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>チェックインコードが正しくありません。</p>
      ) : error === 'window' ? (
        <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>チェックイン可能時間外です（開始2時間前〜開始後6時間）。</p>
      ) : error === 'rate' ? (
        <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>試行回数が多すぎます。しばらく待ってから再度お試しください。</p>
      ) : error ? (
        <p className='rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>チェックインに失敗しました。もう一度お試しください。</p>
      ) : null}
      <div>
        <label htmlFor='checkin-code' className='mb-2 block text-sm font-semibold text-[#1a1a1a]'>
          チェックインコード（4桁）
        </label>
        <input
          id='checkin-code'
          name='code'
          type='text'
          inputMode='numeric'
          pattern='[0-9]{4}'
          maxLength={4}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder='0000'
          className='w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.4em] text-[#1a1a1a] outline-none focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15'
        />
      </div>
      <button type='submit' disabled={code.length !== 4} className='w-full rounded-full bg-[#1f5d4f] py-4 text-sm font-semibold text-white disabled:opacity-50'>
        チェックインする
      </button>
    </form>
  );
}
