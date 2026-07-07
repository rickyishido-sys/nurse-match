'use client';

import { useState, useTransition } from 'react';
import { REPORT_CATEGORIES } from '@/lib/connection/report-constants';
import { submitReportAction } from '@/lib/connection/report-actions';
import type { ReportTargetType } from '@/lib/connection/report-constants';

export type ReportDialogTarget = {
  targetType: ReportTargetType;
  targetMemberId?: string;
  targetEventId?: string;
  label: string;
};

const ERROR_MESSAGE: Record<string, string> = {
  login_required: 'ログインが必要です。',
  invalid_target: '通報対象が無効です。',
  invalid_category: 'カテゴリを選択してください。',
  missing_target: '通報対象が見つかりません。',
  self_report: '自分自身を通報することはできません。',
  submit_failed: '送信に失敗しました。時間をおいて再度お試しください。',
};

type Props = {
  target: ReportDialogTarget;
  canReport: boolean;
  loginNext?: string;
  className?: string;
};

export function ReportButton({ target, canReport, loginNext = '/events', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canReport) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(loginNext)}`}
        className={`inline-flex items-center gap-1 text-[11px] text-[#9a9a9a] underline-offset-2 hover:text-[#6b6b6b] hover:underline ${className}`}
      >
        通報する（要ログイン）
      </a>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitReportAction(formData);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(ERROR_MESSAGE[result.error] ?? '送信に失敗しました。');
      }
    });
  }

  return (
    <>
      <button
        type='button'
        onClick={() => {
          setSubmitted(false);
          setError(null);
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 text-[11px] text-[#9a9a9a] underline-offset-2 hover:text-[#b42318] hover:underline ${className}`}
      >
        通報する
      </button>

      {open ? (
        <div
          className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='report-dialog-title'
        >
          <div className='w-full max-w-md rounded-2xl border border-[#ebe9e4] bg-white p-5 shadow-lg'>
            {submitted ? (
              <div className='space-y-4 text-center'>
                <p className='text-sm font-semibold text-[#1a1a1a]'>通報を受け付けました</p>
                <p className='text-xs leading-6 text-[#6b6b6b]'>
                  運営が内容を確認します。ご協力ありがとうございます。
                </p>
                <button
                  type='button'
                  onClick={() => setOpen(false)}
                  className='h-10 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
                >
                  閉じる
                </button>
              </div>
            ) : (
              <>
                <h2 id='report-dialog-title' className='text-sm font-semibold text-[#1a1a1a]'>
                  通報する
                </h2>
                <p className='mt-1 text-xs text-[#6b6b6b]'>対象: {target.label}</p>
                <p className='mt-2 text-[11px] leading-5 text-[#9a9a9a]'>
                  通報内容は運営のみが確認します。相手には通知されません。
                </p>

                {error ? (
                  <p className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700'>
                    {error}
                  </p>
                ) : null}

                <form action={handleSubmit} className='mt-4 space-y-3'>
                  <input type='hidden' name='targetType' value={target.targetType} />
                  {target.targetMemberId ? (
                    <input type='hidden' name='targetMemberId' value={target.targetMemberId} />
                  ) : null}
                  {target.targetEventId ? (
                    <input type='hidden' name='targetEventId' value={target.targetEventId} />
                  ) : null}

                  <label className='block'>
                    <span className='mb-1 block text-xs font-medium text-[#4a4a4a]'>カテゴリ</span>
                    <select
                      name='category'
                      required
                      className='w-full rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5 text-sm'
                    >
                      <option value=''>選択してください</option>
                      {REPORT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className='block'>
                    <span className='mb-1 block text-xs font-medium text-[#4a4a4a]'>詳細（任意）</span>
                    <textarea
                      name='description'
                      rows={4}
                      maxLength={1000}
                      placeholder='状況を具体的に記入してください'
                      className='w-full rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5 text-sm'
                    />
                  </label>

                  <div className='flex gap-2 pt-1'>
                    <button
                      type='button'
                      onClick={() => setOpen(false)}
                      className='h-10 flex-1 rounded-full border border-[#d8d6d1] text-sm text-[#6b6b6b]'
                    >
                      キャンセル
                    </button>
                    <button
                      type='submit'
                      disabled={pending}
                      className='h-10 flex-1 rounded-full bg-[#1f5d4f] text-sm font-semibold text-white disabled:opacity-60'
                    >
                      {pending ? '送信中…' : '送信'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** 将来のメッセージ画面などで流用するエイリアス */
export { ReportButton as ReportDialog };
