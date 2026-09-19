'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { requestRegisterVerificationAction } from '@/lib/actions';
import { recordLegalConsentAction } from '@/lib/connection/actions';
import { persistOnboardingStep } from '@/lib/connection/onboarding-progress';
import {
  passwordUpdateFailureMessage,
  passwordValidationMessage,
  validateHanakaiPassword,
  type PasswordUpdateFailureCode,
} from '@/lib/connection/password-policy';
import { createClient } from '@/lib/supabase/client';
import { ONB, StepHeading } from './onboarding-ui';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-[18px] text-base leading-relaxed outline-none transition focus:border-current';
const REGISTER_EMAIL_KEY = 'hanakai_register_email';

function mapPasswordApiError(error?: string): string {
  if (error === 'short' || error === 'long' || error === 'mismatch') {
    return passwordValidationMessage(error);
  }
  if (error === 'auth' || error === 'weak' || error === 'failed') {
    return passwordUpdateFailureMessage(error);
  }
  return passwordUpdateFailureMessage('failed');
}

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
  const [sessionExpired, setSessionExpired] = useState(false);
  const [resendEmail, setResendEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.sessionStorage.getItem(REGISTER_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const submitting = useRef(false);

  useEffect(() => {
    console.log('BLOOM_PASSWORD_STEP_START');
  }, []);

  async function tryClientPasswordUpdate(nextPassword: string): Promise<PasswordUpdateFailureCode | 'ok'> {
    const supabase = createClient();
    if (!supabase) return 'failed';
    const { data } = await supabase.auth.getSession();
    if (!data.session) return 'auth';
    const { error: updateError } = await supabase.auth.updateUser({
      password: nextPassword,
      data: { hanakai_password_set: true },
    });
    if (!updateError) return 'ok';
    const message = (updateError.message ?? '').toLowerCase();
    const code = (updateError.code ?? '').toLowerCase();
    if (code === 'same_password' || message.includes('should be different from the old')) return 'ok';
    if (
      code === 'weak_password' ||
      message.includes('pwned') ||
      message.includes('easy to guess') ||
      message.includes('known to be weak')
    ) {
      return 'weak';
    }
    if (
      message.includes('auth session missing') ||
      message.includes('not authenticated') ||
      code === 'session_not_found'
    ) {
      return 'auth';
    }
    return 'failed';
  }

  async function handleNext(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (submitting.current || pending) return;

    setError('');
    setSuccess('');
    const validation = validateHanakaiPassword(password, confirm);
    if (validation) {
      setError(passwordValidationMessage(validation));
      return;
    }

    submitting.current = true;
    setPending(true);
    console.log('BLOOM_PASSWORD_UPDATE_START');

    try {
      const clientResult = await tryClientPasswordUpdate(password);
      if (clientResult === 'ok') {
        console.log('BLOOM_PASSWORD_UPDATE_SUCCESS', { via: 'client' });
        setSuccess('パスワードを設定しました。');
        persistOnboardingStep('nickname');
        onComplete();
        return;
      }

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmPassword: confirm }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (response.ok && result.ok) {
        console.log('BLOOM_PASSWORD_UPDATE_SUCCESS', { via: 'api' });
        setSuccess('パスワードを設定しました。');
        persistOnboardingStep('nickname');
        onComplete();
        return;
      }

      const apiError = result.error ?? clientResult;
      console.error('BLOOM_PASSWORD_UPDATE_ERROR', { error: apiError, status: response.status });
      if (apiError === 'auth' || clientResult === 'auth') {
        setSessionExpired(true);
        setError(passwordUpdateFailureMessage('auth'));
        return;
      }
      setError(mapPasswordApiError(apiError));
    } catch (err) {
      console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: err instanceof Error ? err.message : 'network' });
      setError('通信に失敗しました。接続を確認して再度お試しください。');
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
        subtitle='必須 · 8文字以上72文字以内 · 次回からパスワードでもログインできます'
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
            maxLength={72}
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
            maxLength={72}
            className={inputClass}
            style={{ borderColor: ONB.border, color: ONB.ink }}
          />
        </label>
        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700' role='alert'>
            {error}
          </p>
        ) : null}
        {success ? (
          <p className='rounded-2xl border border-[#d8e2d3] bg-[#eef4ea] px-4 py-3 text-xs text-[#4f7a4a]'>{success}</p>
        ) : null}
        {sessionExpired ? (
          <form action={requestRegisterVerificationAction} className='space-y-3 rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-4'>
            <p className='text-xs leading-6 text-[#6b6b6b]'>
              メールアプリや別ブラウザでリンクを開くと、認証が切れることがあります。同じブラウザで認証メールを開き直すか、下から再送してください。
            </p>
            <label className='block'>
              <span className='mb-1.5 block text-xs font-medium' style={{ color: ONB.subtle }}>
                登録メールアドレス
              </span>
              <input
                type='email'
                name='email'
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className={inputClass}
                style={{ borderColor: ONB.border, color: ONB.ink }}
              />
            </label>
            <button
              type='submit'
              className='w-full rounded-2xl border border-[#1f5d4f] bg-white px-4 py-3 text-sm font-semibold text-[#1f5d4f]'
            >
              認証メールを再送する
            </button>
          </form>
        ) : null}
      </div>
      <button
        type='button'
        disabled={pending}
        onClick={handleNext}
        className='mt-auto rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60'
        style={{ backgroundColor: ONB.accent }}
      >
        {pending ? 'パスワードを設定しています…' : '次へ'}
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
