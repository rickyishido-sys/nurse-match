'use client';

import { useState } from 'react';
import { deleteHanakaiAccountAction } from '@/lib/connection/actions';

const ACCENT = '#1f5d4f';
const DANGER = '#b42318';

const DELETE_ITEMS = [
  'プロフィール（表示名・自己紹介・基本情報）',
  'SNSリンク',
  '投稿',
  '写真',
  '参加申請',
  'グループ参加情報',
] as const;

export function DeleteAccountForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set('confirmed', '1');
      formData.set('reason', reason);
      await deleteHanakaiAccountAction(formData);
    } catch {
      setError('アカウント削除に失敗しました。時間をおいて再度お試しください。');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='rounded-2xl border border-[#f3d6d3] bg-[#fff7f6] px-5 py-4'>
        <p className='text-sm font-semibold' style={{ color: DANGER }}>
          この操作は取り消せません
        </p>
        <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
          アカウントを削除すると、HANAKAI Connection 上の利用が停止します。ログインしても通常の機能は使えなくなります。
        </p>
      </div>

      <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-5'>
        <p className='text-xs font-semibold tracking-[0.18em] text-[#9a9a9a]'>削除される内容</p>
        <ul className='mt-4 space-y-2.5'>
          {DELETE_ITEMS.map((item) => (
            <li key={item} className='flex items-start gap-2.5 text-sm text-[#3a3a3a]'>
              <span className='mt-0.5 text-[#b42318]' aria-hidden>
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className='mt-4 text-xs leading-6 text-[#9a9a9a]'>
          プロフィール・投稿・参加情報など個人データは削除または匿名化されます。運営記録として必要な情報のみ、プライバシーポリシーに従い保持します。認証アカウント（メールログイン）も削除され、再ログインはできません。
        </p>
      </div>

      <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-5'>
        <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>
          退会理由（任意）
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder='よろしければ退会理由をお聞かせください'
          className='w-full resize-none rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-1 focus:ring-[#1f5d4f]/20'
        />
      </div>

      <label className='flex cursor-pointer items-start gap-3 rounded-2xl border border-[#ebe9e4] bg-white px-5 py-4'>
        <input
          type='checkbox'
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className='mt-1 h-4 w-4 rounded border-[#d8d6d1]'
        />
        <span className='text-sm leading-7 text-[#3a3a3a]'>
          上記の内容を理解し、削除されるデータについて確認しました。この操作は取り消せないことに同意します。
        </span>
      </label>

      {error ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>{error}</p>
      ) : null}

      <button
        type='submit'
        disabled={!confirmed || submitting}
        className='flex h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold text-white transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
        style={{ backgroundColor: confirmed ? DANGER : '#d8d6d1' }}
      >
        {submitting ? '削除しています…' : 'アカウントを削除する'}
      </button>
    </form>
  );
}
