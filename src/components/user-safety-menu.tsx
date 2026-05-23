'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { blockUserAction, createReportAction } from '@/lib/actions';

type UserSafetyMenuProps = {
  reporterId: string;
  targetUserId: string;
  compact?: boolean;
  onBlocked?: () => void;
};

export function UserSafetyMenu({ reporterId, targetUserId, compact = false, onBlocked }: UserSafetyMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'reported' | 'blocked'>('idle');
  const [reasonType, setReasonType] = useState<'harassment' | 'spam' | 'fake_profile' | 'dangerous' | 'other'>('harassment');
  const [detail, setDetail] = useState('');
  const router = useRouter();

  function submitReport() {
    if (isPending) return;
    startTransition(async () => {
      const form = new FormData();
      form.set('reporterId', reporterId);
      form.set('targetUserId', targetUserId);
      form.set('reasonType', reasonType);
      form.set('reason', 'ユーザー通報');
      form.set('detail', detail);
      await createReportAction(form);
      setStatus('reported');
      router.refresh();
    });
  }

  function submitBlock() {
    if (isPending) return;
    const ok = window.confirm('この相手をブロックしますか？以後、相互に表示されなくなります。');
    if (!ok) return;
    startTransition(async () => {
      const form = new FormData();
      form.set('blockerUserId', reporterId);
      form.set('blockedUserId', targetUserId);
      await blockUserAction(form);
      setStatus('blocked');
      onBlocked?.();
      router.refresh();
    });
  }

  return (
    <details className='relative'>
      <summary className={`${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} cursor-pointer list-none rounded-xl border border-slate-200 bg-white text-slate-600`}>
        通報 / ブロック
      </summary>
      <div className='absolute right-0 z-20 mt-2 w-[260px] rounded-2xl border border-slate-100 bg-white p-3 shadow-xl'>
        <p className='mb-2 text-xs font-semibold text-slate-700'>安全メニュー</p>
        <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2'>
          <select
            value={reasonType}
            onChange={(event) => setReasonType(event.target.value as typeof reasonType)}
            className='h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs'
            disabled={isPending}
          >
            <option value='harassment'>不適切な発言</option>
            <option value='spam'>勧誘</option>
            <option value='fake_profile'>なりすまし</option>
            <option value='dangerous'>不快行為</option>
            <option value='other'>その他</option>
          </select>
          <input
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder='詳細（任意）'
            className='h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs'
            disabled={isPending}
          />
          <button
            type='button'
            disabled={isPending}
            onClick={submitReport}
            className='h-8 w-full rounded-lg border border-slate-300 bg-white text-xs text-slate-700 disabled:opacity-50'
          >
            通報を送信
          </button>
        </div>
        <button
          type='button'
          disabled={isPending}
          onClick={submitBlock}
          className='mt-2 h-8 w-full rounded-lg border border-red-200 bg-red-50 text-xs text-red-700 disabled:opacity-50'
        >
          この相手をブロック
        </button>
        {status === 'reported' ? <p className='mt-2 text-[11px] text-emerald-700'>通報を受け付けました。</p> : null}
        {status === 'blocked' ? <p className='mt-2 text-[11px] text-slate-600'>ブロックしました。</p> : null}
      </div>
    </details>
  );
}
