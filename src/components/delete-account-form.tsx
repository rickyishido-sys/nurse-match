'use client';

import { deleteAccountAction } from '@/lib/actions';

export function DeleteAccountForm() {
  return (
    <form
      action={deleteAccountAction}
      onSubmit={(event) => {
        const ok = window.confirm('退会すると元に戻せません。本当に退会しますか？');
        if (!ok) event.preventDefault();
      }}
      className='space-y-3'
    >
      <p className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600'>
        少し休憩したい場合も、いつでも退会できます。退会後はログアウトされ、プロフィール・候補・チャットは表示されなくなります。
      </p>
      <label className='grid gap-1 text-xs text-slate-600'>
        退会理由（任意）
        <textarea
          name='deleteReason'
          rows={3}
          placeholder='例: いったん休憩したい / 希望条件に合う相手が少なかった'
          className='rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700'
        />
      </label>
      <label className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
        <input type='checkbox' required />
        退会すると元に戻せないことに同意します
      </label>
      <button className='w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700'>
        退会する
      </button>
    </form>
  );
}
