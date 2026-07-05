'use client';

import { useState, useTransition } from 'react';
import { setRegistrationPasswordAction } from '@/lib/connection/actions';
import { ONB, StepHeading } from './onboarding-ui';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-[18px] text-base leading-relaxed outline-none transition focus:border-current';

/** ログイン用パスワード設定（メール認証直後の新規登録向け） */
export function PasswordStep({
  index,
  art,
  onComplete,
}: {
  index: number;
  art?: string;
  onComplete: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません。');
      return;
    }
    const fd = new FormData();
    fd.set('password', password);
    fd.set('confirmPassword', confirm);
    startTransition(async () => {
      const result = await setRegistrationPasswordAction(fd);
      if (result?.error) {
        setError(
          result.error === 'mismatch'
            ? 'パスワードが一致しません。'
            : result.error === 'short'
              ? 'パスワードは8文字以上で入力してください。'
              : 'パスワードの設定に失敗しました。もう一度お試しください。',
        );
        return;
      }
      onComplete();
    });
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-1 flex-col'>
      <StepHeading
        index={index}
        art={art}
        title='ログイン用パスワードを設定しましょう'
        subtitle='必須 · 8文字以上 · 次回からパスワードでもログインできます'
      />
      <div className='mt-6 space-y-4'>
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium' style={{ color: ONB.subtle }}>
            パスワード
          </span>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='new-password'
            minLength={8}
            required
            className={inputClass}
            style={{ borderColor: ONB.border, color: ONB.ink }}
          />
        </label>
        <label className='block'>
          <span className='mb-1.5 block text-xs font-medium' style={{ color: ONB.subtle }}>
            パスワード（確認）
          </span>
          <input
            type='password'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete='new-password'
            minLength={8}
            required
            className={inputClass}
            style={{ borderColor: ONB.border, color: ONB.ink }}
          />
        </label>
        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>{error}</p>
        ) : null}
      </div>
      <button
        type='submit'
        disabled={pending}
        className='mt-auto rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60'
        style={{ backgroundColor: ONB.accent }}
      >
        {pending ? '設定中…' : '次へ'}
      </button>
    </form>
  );
}

/** 本人確認書類アップロード */
export function IdentityDocumentStep({
  index,
  art,
  fileName,
  onFileChange,
}: {
  index: number;
  art?: string;
  fileName: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div>
      <StepHeading
        index={index}
        art={art}
        title='本人確認書類をアップロードしてください'
        subtitle='必須 · 運転免許証・マイナンバーカード・パスポートなど'
      />
      <p className='mt-4 text-[14px] leading-7' style={{ color: ONB.subtle }}>
        なりすまし防止のため、本人確認書類の提出をお願いしています。提出いただいた書類は運営が確認し、審査完了後に本人確認済みバッジが付与されます。
      </p>
      <div className='mt-6'>
        <input
          type='file'
          accept='image/*,.pdf'
          required
          className='w-full rounded-2xl border border-dashed bg-white px-4 py-4 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#edf3ef] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1f5d4f]'
          style={{ borderColor: ONB.border, color: ONB.ink }}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {fileName ? (
          <p className='mt-2 text-xs' style={{ color: ONB.accent }}>
            選択中: {fileName}
          </p>
        ) : null}
        <p className='mt-2 text-xs' style={{ color: ONB.subtle }}>
          JPG / PNG / PDF · 10MB以下
        </p>
      </div>
    </div>
  );
}
