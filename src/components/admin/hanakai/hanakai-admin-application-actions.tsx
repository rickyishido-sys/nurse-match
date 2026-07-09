'use client';

import { useState } from 'react';
import {
  adminApproveApplicationAction,
  adminRejectApplicationAction,
} from '@/lib/connection/hanakai-admin-actions';

type Props = {
  applicationId: string;
  eventTitle: string;
  memberNickname: string;
};

export function AdminApplicationActions({ applicationId, eventTitle, memberNickname }: Props) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [note, setNote] = useState('');

  if (mode === 'idle') {
    return (
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => setMode('approve')}
          className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white transition hover:bg-[#174a3f]'
        >
          参加決定
        </button>
        <button
          type='button'
          onClick={() => setMode('reject')}
          className='rounded-full border border-[#e2ddd2] bg-white px-3 py-1 text-[11px] font-medium text-[#8b3a3a] transition hover:bg-[#fdf5f5]'
        >
          却下
        </button>
      </div>
    );
  }

  if (mode === 'approve') {
    return (
      <form action={adminApproveApplicationAction} className='space-y-2'>
        <input type='hidden' name='applicationId' value={applicationId} />
        <p className='max-w-[220px] text-[11px] leading-5 text-[#6b6b6b]'>
          「{memberNickname}」の「{eventTitle}」への参加を決定します。確認メールが送信されます。
        </p>
        <div className='flex flex-wrap gap-2'>
          <button
            type='submit'
            className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'
          >
            参加決定する
          </button>
          <button
            type='button'
            onClick={() => setMode('idle')}
            className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'
          >
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={adminRejectApplicationAction} className='space-y-2'>
      <input type='hidden' name='applicationId' value={applicationId} />
      <p className='max-w-[220px] text-[11px] leading-5 text-[#6b6b6b]'>
        「{memberNickname}」の申請を却下します。理由を入力してください。
      </p>
      <textarea
        name='decisionNote'
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        required
        placeholder='却下理由（運営メモ）'
        className='w-full max-w-[220px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
      />
      <div className='flex flex-wrap gap-2'>
        <button
          type='submit'
          className='rounded-full border border-[#e2ddd2] bg-[#fdf5f5] px-3 py-1 text-[11px] font-medium text-[#8b3a3a]'
        >
          却下する
        </button>
        <button
          type='button'
          onClick={() => {
            setMode('idle');
            setNote('');
          }}
          className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export function AdminApplicationProcessed({
  status,
  decidedAt,
}: {
  status: 'confirmed' | 'rejected' | 'awaiting_confirmation' | 'cancelled';
  decidedAt: string | null;
}) {
  const label =
    status === 'confirmed'
      ? '参加確定'
      : status === 'awaiting_confirmation'
        ? '確認待ち'
        : status === 'cancelled'
          ? '辞退済み'
          : '却下済み';
  return (
    <span className='text-[11px] text-[#9a9a9a]'>
      {label}
      {decidedAt ? ` · ${new Date(decidedAt).toLocaleDateString('ja-JP')}` : ''}
    </span>
  );
}
