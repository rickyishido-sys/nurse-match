'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { recordLegalConsentAction } from '@/lib/connection/actions';
import { ONB, StepHeading } from './onboarding-ui';
import { persistOnboardingStep } from '@/lib/connection/onboarding-progress';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-[18px] text-base leading-relaxed outline-none transition focus:border-current';

/** 本人確認前の利用規約・プライバシーポリシー同意 */
export function PreIdentityConsentStep({
  index,
  art,
  onComplete,
}: {
  index: number;
  art?: string;
  onComplete: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  useEffect(() => {
    console.log('HANAKAI_PRE_IDENTITY_CONSENT_STEP_START');
  }, []);

  async function handleProceed(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (submitting.current || pending) return;

    setError('');
    if (!termsAccepted || !privacyAccepted) {
      setError('利用規約とプライバシーポリシーの両方に同意してください。');
      return;
    }

    submitting.current = true;
    setPending(true);

    try {
      const formData = new FormData();
      formData.set('terms', termsAccepted ? '1' : '0');
      formData.set('privacy', privacyAccepted ? '1' : '0');
      formData.set('platform', detectClientConsentPlatform());
      await recordLegalConsentAction(formData);
      router.refresh();
      persistOnboardingStep('identity');
      onComplete();
    } catch (err) {
      console.error('HANAKAI_PRE_IDENTITY_CONSENT_ERROR', { message: String(err) });
      setError('同意の保存に失敗しました。通信環境を確認して再度お試しください。');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const canProceed = termsAccepted && privacyAccepted && !pending;

  return (
    <div className='flex flex-1 flex-col'>
      <StepHeading
        index={index}
        art={art}
        title='本人確認の前に'
        subtitle='安心してご利用いただくための確認'
      />
      <p className='mt-4 text-sm leading-7' style={{ color: ONB.subtle }}>
        安心してご利用いただくため、本人確認をお願いしています。
        <br />
        本人確認書類は運営による確認のみに使用し、他の参加者へ公開されることはありません。
        <br />
        ご利用前に、利用規約とプライバシーポリシーをご確認ください。
      </p>
      <div className='mt-6 space-y-3'>
        <label
          className='flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-4 transition'
          style={{ borderColor: termsAccepted ? ONB.accent : ONB.border }}
        >
          <input
            type='checkbox'
            data-testid='legal-consent-terms'
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className='mt-0.5 h-4 w-4 shrink-0 rounded accent-[#1f5d4f]'
          />
          <span className='text-sm leading-7' style={{ color: ONB.ink }}>
            <Link href='/terms' target='_blank' rel='noopener noreferrer' className='font-semibold underline underline-offset-2'>
              利用規約
            </Link>
            を確認し、同意します
          </span>
        </label>
        <label
          className='flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-4 transition'
          style={{ borderColor: privacyAccepted ? ONB.accent : ONB.border }}
        >
          <input
            type='checkbox'
            data-testid='legal-consent-privacy'
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className='mt-0.5 h-4 w-4 shrink-0 rounded accent-[#1f5d4f]'
          />
          <span className='text-sm leading-7' style={{ color: ONB.ink }}>
            <Link href='/privacy' target='_blank' rel='noopener noreferrer' className='font-semibold underline underline-offset-2'>
              プライバシーポリシー
            </Link>
            を確認し、同意します
          </span>
        </label>
        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>{error}</p>
        ) : null}
      </div>
      <button
        type='button'
        data-testid='legal-consent-submit'
        disabled={!canProceed}
        onClick={handleProceed}
        className='mt-auto rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50'
        style={{ backgroundColor: ONB.accent }}
      >
        {pending ? '保存中…' : '本人確認へ進む'}
      </button>
    </div>
  );
}

function detectClientConsentPlatform(): 'ios' | 'android' | 'web' {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'web';
}

/** @deprecated 本人確認前ステップへ移行。PreIdentityConsentStep を使用 */
export function LegalConsentStep({
  index,
  art,
  onComplete,
}: {
  index: number;
  art?: string;
  onComplete: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  useEffect(() => {
    console.log('BLOOM_LEGAL_CONSENT_STEP_START');
  }, []);

  async function handleNext(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (submitting.current || pending) return;

    setError('');
    if (!termsAccepted || !privacyAccepted) {
      setError('利用規約とプライバシーポリシーの両方に同意してください。');
      return;
    }

    submitting.current = true;
    setPending(true);

    try {
      const formData = new FormData();
      formData.set('terms', termsAccepted ? '1' : '0');
      formData.set('privacy', privacyAccepted ? '1' : '0');
      await recordLegalConsentAction(formData);
      router.refresh();
      persistOnboardingStep('password');
      onComplete();
    } catch (err) {
      console.error('BLOOM_LEGAL_CONSENT_ERROR', { message: String(err) });
      setError('同意の保存に失敗しました。通信環境を確認して再度お試しください。');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col'>
      <StepHeading
        index={index}
        art={art}
        title='利用規約とプライバシーポリシー'
        subtitle='必須 · 登録を続けるには同意が必要です'
      />
      <div className='mt-6 space-y-4'>
        <label className='flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-4' style={{ borderColor: ONB.border }}>
          <input
            type='checkbox'
            data-testid='legal-consent-terms'
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className='mt-1 h-4 w-4 rounded'
          />
          <span className='text-sm leading-7' style={{ color: ONB.ink }}>
            <Link href='/terms' target='_blank' rel='noopener noreferrer' className='font-semibold underline underline-offset-2'>
              利用規約
            </Link>
            に同意します
          </span>
        </label>
        <label className='flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-4' style={{ borderColor: ONB.border }}>
          <input
            type='checkbox'
            data-testid='legal-consent-privacy'
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className='mt-1 h-4 w-4 rounded'
          />
          <span className='text-sm leading-7' style={{ color: ONB.ink }}>
            <Link href='/privacy' target='_blank' rel='noopener noreferrer' className='font-semibold underline underline-offset-2'>
              プライバシーポリシー
            </Link>
            に同意します
          </span>
        </label>
        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>{error}</p>
        ) : null}
      </div>
      <button
        type='button'
        data-testid='legal-consent-submit'
        disabled={pending || !termsAccepted || !privacyAccepted}
        onClick={handleNext}
        className='mt-auto rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60'
        style={{ backgroundColor: ONB.accent }}
      >
        {pending ? '保存中…' : '同意して次へ'}
      </button>
    </div>
  );
}

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
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    console.log('BLOOM_PASSWORD_STEP_START');
  }, []);

  async function handleNext(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (submitting.current || pending) return;

    setError('');
    setSuccess('');
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません。');
      return;
    }

    submitting.current = true;
    setPending(true);
    console.log('BLOOM_PASSWORD_UPDATE_START');

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmPassword: confirm }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string };

      if (!response.ok || result.error) {
        const message =
          result.error === 'mismatch'
            ? 'パスワードが一致しません。'
            : result.error === 'short'
              ? 'パスワードは8文字以上で入力してください。'
              : result.detail
                ? `パスワードの設定に失敗しました: ${result.detail}`
                : 'パスワードの設定に失敗しました。もう一度お試しください。';
        console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: result.detail ?? result.error });
        setError(message);
        return;
      }

      console.log('BLOOM_PASSWORD_UPDATE_SUCCESS');
      setSuccess('パスワードを設定しました。');
      persistOnboardingStep('nickname');
      console.log('BLOOM_ONBOARDING_MOVE_TO_NICKNAME');
      onComplete();
    } catch (err) {
      console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: String(err) });
      setError('パスワードの設定に失敗しました。通信環境を確認して再度お試しください。');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function blockEnter(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div className='flex flex-1 flex-col' onKeyDown={blockEnter}>
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
            className={inputClass}
            style={{ borderColor: ONB.border, color: ONB.ink }}
          />
        </label>
        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>{error}</p>
        ) : null}
        {success ? (
          <p className='rounded-2xl border border-[#d8e2d3] bg-[#eef4ea] px-4 py-3 text-xs text-[#4f7a4a]'>{success}</p>
        ) : null}
      </div>
      <button
        type='button'
        disabled={pending}
        onClick={handleNext}
        className='mt-auto rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60'
        style={{ backgroundColor: ONB.accent }}
      >
        {pending ? '設定中…' : '次へ'}
      </button>
    </div>
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
        本人確認（必須）です。書類をアップロードいただくとHANAKAI運営が確認し、認証済みバッジが付与されます。イベント参加・作成には認証済みである必要があります。
      </p>
      <div className='mt-6'>
        <input
          type='file'
          accept='image/*,.pdf'
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
