'use client';

import { useState } from 'react';
import { ctaPrimaryFull } from '@/components/connection/ui/cta-classes';
import { requestPasswordResetAction } from '@/lib/connection/v1-actions';

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSubmitting(true);
        try {
          await requestPasswordResetAction(formData);
        } finally {
          setSubmitting(false);
        }
      }}
      className='space-y-4'
    >
      <label className='block'>
        <span className='mb-1.5 block text-xs font-medium text-[#6b6b6b]'>メールアドレス</span>
        <input
          type='email'
          name='email'
          required
          autoComplete='email'
          placeholder='email@example.com'
          className='min-h-[44px] w-full rounded-2xl border border-[#e8e4dc] bg-white/80 px-4 py-3 text-sm text-[#1a1a1a] outline-none backdrop-blur transition focus:border-[#1f5d4f] focus:ring-4 focus:ring-[#1f5d4f]/10'
        />
      </label>
      <button type='submit' disabled={submitting} className={`hk-brand-btn min-h-[44px] ${ctaPrimaryFull} disabled:opacity-60`}>
        {submitting ? '送信中…' : '再設定メールを送信'}
      </button>
    </form>
  );
}
