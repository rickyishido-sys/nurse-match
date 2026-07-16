'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminUpdateRevenueReportAction } from '@/lib/connection/event-operations/actions';
import type { EventRevenueReport } from '@/lib/connection/event-operations/types';
import { REVENUE_REPORT_STATUS_LABEL } from '@/lib/connection/event-operations/types';

type Props = {
  report: EventRevenueReport;
  eventTitle: string;
};

export function HanakaiAdminRevenueReportActions({ report, eventTitle }: Props) {
  const [mode, setMode] = useState<'idle' | 'revision' | 'memo'>('idle');
  const [adminMemo, setAdminMemo] = useState(report.adminMemo ?? '');
  const [revisionReason, setRevisionReason] = useState(report.revisionReason ?? '');

  if (mode === 'revision' || mode === 'memo') {
    const status = mode === 'revision' ? 'revision_requested' : report.status;
    return (
      <form action={adminUpdateRevenueReportAction} className='space-y-2'>
        <input type='hidden' name='reportId' value={report.id} />
        <input type='hidden' name='status' value={status} />
        {mode === 'revision' ? (
          <textarea
            name='revisionReason'
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={2}
            required
            placeholder='修正依頼の理由'
            className='w-full max-w-[280px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
          />
        ) : (
          <textarea
            name='adminMemo'
            value={adminMemo}
            onChange={(e) => setAdminMemo(e.target.value)}
            rows={2}
            placeholder='内部メモ'
            className='w-full max-w-[280px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
          />
        )}
        <div className='flex flex-wrap gap-2'>
          <button type='submit' className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'>
            {mode === 'revision' ? '修正依頼を送る' : 'メモを保存'}
          </button>
          <button type='button' onClick={() => setMode('idle')} className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#9a9a9a]'>
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {report.status === 'submitted' ? (
          <form action={adminUpdateRevenueReportAction}>
            <input type='hidden' name='reportId' value={report.id} />
            <input type='hidden' name='status' value='approved' />
            <button type='submit' className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'>
              承認
            </button>
          </form>
        ) : null}
        <button type='button' onClick={() => setMode('revision')} className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'>
          修正依頼
        </button>
        <button type='button' onClick={() => setMode('memo')} className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'>
          内部メモ
        </button>
      </div>
      <Link href={`/events/${report.eventId}/revenue-report`} className='block text-[10px] text-[#1f5d4f] hover:underline'>
        {eventTitle} →
      </Link>
      <span className='text-[10px] text-[#9a9a9a]'>{REVENUE_REPORT_STATUS_LABEL[report.status]}</span>
    </div>
  );
}
