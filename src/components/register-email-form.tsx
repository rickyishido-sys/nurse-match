'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestRegisterVerificationAction } from '@/lib/actions';

const COOLDOWN_STORAGE_KEY = 'hanakai:register-cooldown';
// Temporary relaxed resend interval for active verification testing.
const COOLDOWN_SECONDS = 10;

function SubmitButton({ cooldownRemaining }: { cooldownRemaining: number }) {
  const { pending } = useFormStatus();
  const disabled = pending || cooldownRemaining > 0;
  const label = pending
    ? '送信中...'
    : cooldownRemaining > 0
      ? `再送まで ${cooldownRemaining}秒`
      : '認証リンクを送る';

  return (
    <button
      type='submit'
      disabled={disabled}
      className='w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
    >
      {label}
    </button>
  );
}

type RegisterEmailFormProps = {
  sent: boolean;
  allowBurst?: boolean;
};

export function RegisterEmailForm({ sent, allowBurst = false }: RegisterEmailFormProps) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    function syncCooldownFromStorage() {
      try {
        const saved = Number(window.localStorage.getItem(COOLDOWN_STORAGE_KEY) ?? 0);
        const remaining = Math.max(0, Math.ceil((saved - Date.now()) / 1000));
        setCooldownRemaining(allowBurst ? 0 : remaining);
      } catch {
        setCooldownRemaining(0);
      }
    }

    const kickoff = window.setTimeout(syncCooldownFromStorage, 0);
    const timer = window.setInterval(syncCooldownFromStorage, 500);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [allowBurst]);

  useEffect(() => {
    if (!sent) return;
    let kickoff: number | null = null;
    try {
      const seconds = allowBurst ? 0 : COOLDOWN_SECONDS;
      const nextCooldownUntil = Date.now() + seconds * 1000;
      window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(nextCooldownUntil));
      kickoff = window.setTimeout(() => setCooldownRemaining(seconds), 0);
    } catch {
      // noop
    }
    return () => {
      if (kickoff) window.clearTimeout(kickoff);
    };
  }, [sent, allowBurst]);

  return (
    <form action={requestRegisterVerificationAction} className='space-y-4'>
      <label className='block'>
        <span className='mb-1.5 block text-xs font-medium text-slate-600'>メールアドレス</span>
        <input
          type='email'
          name='email'
          required
          placeholder='email@example.com'
          className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
        />
      </label>
      {allowBurst ? <input type='hidden' name='allowBurst' value='1' /> : null}
      {allowBurst ? (
        <p className='rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-700'>
          テストモード: Gmailは自動で +エイリアスに変換して送信します。
        </p>
      ) : null}
      <SubmitButton cooldownRemaining={cooldownRemaining} />
    </form>
  );
}
