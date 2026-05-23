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
