'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BrandAuthFrame } from '@/components/connection/brand/brand-auth-frame';
import { ctaPrimaryFull } from '@/components/connection/ui/cta-classes';

type ResetPasswordFormProps = {
  error?: string;
};

export function ResetPasswordForm({ error }: ResetPasswordFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirmPassword') ?? '');
    if (password.length < 8) {
      setFormError('パスワードは8文字以上で入力してください。');
      setSubmitting(false);
      return;
    }
    if (password !== confirm) {
      setFormError('パスワードが一致しません。');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword: confirm }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (data.error === 'auth') {
          setFormError('セッションの有効期限が切れています。もう一度メールのリンクをお試しください。');
        } else {
          setFormError('パスワードの更新に失敗しました。時間をおいて再度お試しください。');
        }
        return;
      }
      router.push('/reset-password/success');
    } catch {
      setFormError('通信に失敗しました。接続を確認して再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BrandAuthFrame title='新しいパスワード' subtitle='8文字以上で設定してください' characterId='E1'>
      {error === 'session' ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          リンクが無効か期限切れです。<Link href='/forgot-password' className='font-semibold underline'>再設定メール</Link>をもう一度お試しください。
        </div>
      ) : null}
      {formError ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700' role='alert'>
          {formError}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium text-[#6b6b6b]'>新しいパスワード</span>
          <input
            type='password'
            name='password'
            required
            minLength={8}
            autoComplete='new-password'
            className='min-h-[44px] w-full rounded-2xl border border-[#e8e4dc] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#1f5d4f] focus:ring-4 focus:ring-[#1f5d4f]/10'
          />
        </label>
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium text-[#6b6b6b]'>新しいパスワード（確認）</span>
          <input
            type='password'
            name='confirmPassword'
            required
            minLength={8}
            autoComplete='new-password'
            className='min-h-[44px] w-full rounded-2xl border border-[#e8e4dc] bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#1f5d4f] focus:ring-4 focus:ring-[#1f5d4f]/10'
          />
        </label>
        <button type='submit' disabled={submitting} className={`hk-brand-btn min-h-[44px] ${ctaPrimaryFull} disabled:opacity-60`}>
          {submitting ? '保存中…' : 'パスワードを更新'}
        </button>
      </form>
      <p className='mt-6 text-center'>
        <Link href='/login' className='text-sm font-medium text-[#1f5d4f] underline-offset-2 hover:underline'>
          ログインに戻る
        </Link>
      </p>
    </BrandAuthFrame>
  );
}
