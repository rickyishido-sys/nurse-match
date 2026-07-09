'use client';

import { useState } from 'react';
import { submitContactInquiryAction } from '@/lib/connection/contact-actions';
import { CONTACT_INQUIRY_CATEGORIES, type ContactInquiryCategory } from '@/lib/connection/contact-inquiry-constants';

const fieldClass =
  'w-full rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-1 focus:ring-[#1f5d4f]/20';

type ContactFormProps = {
  defaultEmail?: string;
  defaultName?: string;
  defaultCategory?: ContactInquiryCategory;
};

export function ContactForm({ defaultEmail = '', defaultName = '', defaultCategory = 'service' }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await submitContactInquiryAction(formData);
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div>
        <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>お名前</label>
        <input
          name='name'
          type='text'
          required
          maxLength={80}
          defaultValue={defaultName}
          placeholder='例：山田 花子'
          className={fieldClass}
        />
      </div>

      <div>
        <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>メールアドレス</label>
        <input
          name='email'
          type='email'
          required
          maxLength={254}
          defaultValue={defaultEmail}
          placeholder='email@example.com'
          className={fieldClass}
        />
      </div>

      <div>
        <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>お問い合わせ種別</label>
        <select name='category' required className={fieldClass} defaultValue={defaultCategory}>
          {CONTACT_INQUIRY_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>お問い合わせ内容</label>
        <textarea
          name='message'
          required
          rows={6}
          maxLength={2000}
          placeholder='お問い合わせ内容をご記入ください'
          className={`${fieldClass} resize-none leading-7`}
        />
      </div>

      {error ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>{error}</p>
      ) : null}

      <button
        type='submit'
        disabled={submitting}
        className='flex h-[52px] w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {submitting ? '送信中…' : '送信する'}
      </button>
    </form>
  );
}
