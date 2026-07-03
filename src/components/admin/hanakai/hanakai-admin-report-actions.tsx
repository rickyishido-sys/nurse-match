'use client';

import { useState } from 'react';
import { adminUpdateReportStatusAction } from '@/lib/connection/hanakai-admin-actions';
import type { AdminReportStatus } from '@/lib/connection/hanakai-admin-types';

type Props = {
  reportId: string;
  status: AdminReportStatus;
};

export function AdminReportActions({ reportId, status }: Props) {
  const [mode, setMode] = useState<'idle' | 'dismiss'>('idle');
  const [note, setNote] = useState('');

  if (status === 'resolved' || status === 'dismissed') {
    return <span className='text-[11px] text-[#9a9a9a]'>処理完了</span>;
  }

  if (mode === 'dismiss') {
    return (
      <form action={adminUpdateReportStatusAction} className='space-y-2'>
        <input type='hidden' name='reportId' value={reportId} />
        <input type='hidden' name='status' value='dismissed' />
        <textarea
          name='note'
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          required
          placeholder='dismissed の理由'
          className='w-full max-w-[200px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
        />
        <div className='flex flex-wrap gap-2'>
          <button
            type='submit'
            className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'
          >
            dismissed にする
          </button>
          <button
            type='button'
            onClick={() => {
              setMode('idle');
              setNote('');
            }}
            className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#9a9a9a]'
          >
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {status === 'open' ? (
        <form action={adminUpdateReportStatusAction}>
          <input type='hidden' name='reportId' value={reportId} />
          <input type='hidden' name='status' value='reviewing' />
          <button
            type='submit'
            className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'
          >
            確認中にする
          </button>
        </form>
      ) : null}
      {status === 'reviewing' ? (
        <form action={adminUpdateReportStatusAction}>
          <input type='hidden' name='reportId' value={reportId} />
          <input type='hidden' name='status' value='resolved' />
          <button
            type='submit'
            className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'
          >
            対応済み
          </button>
        </form>
      ) : null}
      <button
        type='button'
        onClick={() => setMode('dismiss')}
        className='rounded-full border border-[#e2ddd2] bg-white px-3 py-1 text-[11px] text-[#6b6b6b]'
      >
        dismissed
      </button>
    </div>
  );
}
