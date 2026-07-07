'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminSaveReportNoteAction, adminUpdateReportStatusAction } from '@/lib/connection/hanakai-admin-actions';
import type { AdminReportRow, AdminReportStatus } from '@/lib/connection/hanakai-admin-types';

type Props = {
  report: AdminReportRow;
};

function normalizeStatus(status: AdminReportStatus): AdminReportStatus {
  return status === 'open' ? 'new' : status;
}

export function AdminReportActions({ report }: Props) {
  const status = normalizeStatus(report.status);
  const [mode, setMode] = useState<'idle' | 'dismiss' | 'note'>('idle');
  const [note, setNote] = useState(report.adminNote ?? '');

  if (status === 'resolved' || status === 'dismissed') {
    return (
      <div className='space-y-1'>
        <span className='text-[11px] text-[#9a9a9a]'>処理完了</span>
        {report.adminNote ? (
          <p className='text-[10px] text-[#6b6b6b]'>メモ: {report.adminNote}</p>
        ) : null}
      </div>
    );
  }

  if (mode === 'dismiss' || mode === 'note') {
    const FormAction = mode === 'note' ? adminSaveReportNoteAction : adminUpdateReportStatusAction;
    return (
      <form action={FormAction} className='space-y-2'>
        <input type='hidden' name='reportId' value={report.id} />
        {mode === 'dismiss' ? <input type='hidden' name='status' value='dismissed' /> : null}
        <textarea
          name='note'
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          required={mode === 'dismiss'}
          placeholder={mode === 'dismiss' ? '却下理由' : '管理メモ'}
          className='w-full max-w-[240px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
        />
        <div className='flex flex-wrap gap-2'>
          {mode === 'note' ? (
            <button
              type='submit'
              className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'
            >
              メモを保存
            </button>
          ) : (
            <button
              type='submit'
              className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'
            >
              却下する
            </button>
          )}
          <button
            type='button'
            onClick={() => {
              setMode('idle');
              setNote(report.adminNote ?? '');
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
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {status === 'new' ? (
          <form action={adminUpdateReportStatusAction}>
            <input type='hidden' name='reportId' value={report.id} />
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
            <input type='hidden' name='reportId' value={report.id} />
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
          却下
        </button>
        <button
          type='button'
          onClick={() => setMode('note')}
          className='rounded-full border border-[#e2ddd2] bg-white px-3 py-1 text-[11px] text-[#6b6b6b]'
        >
          メモ
        </button>
      </div>
      <ReportTargetLinks report={report} />
    </div>
  );
}

function ReportTargetLinks({ report }: { report: AdminReportRow }) {
  return (
    <div className='flex flex-wrap gap-2 text-[10px]'>
      {report.targetMemberId ? (
        <Link href={`/admin/hanakai/members/${report.targetMemberId}`} className='text-[#1f5d4f] hover:underline'>
          対象ユーザー →
        </Link>
      ) : null}
      {report.targetEventId ? (
        <Link href={`/events/${report.targetEventId}`} className='text-[#1f5d4f] hover:underline'>
          対象イベント →
        </Link>
      ) : null}
      {report.reporterMemberId ? (
        <Link href={`/admin/hanakai/members/${report.reporterMemberId}`} className='text-[#6b6b6b] hover:underline'>
          通報者 →
        </Link>
      ) : null}
    </div>
  );
}
