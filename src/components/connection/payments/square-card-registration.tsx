'use client';

import Script from 'next/script';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { getPublicSquareConfig, PAYMENT_CONSENT_TEXT } from '@/lib/square/public-config';
import { HANAKAI_USAGE_FEE_LABEL, formatHanakaiUsageFee } from '@/lib/connection/hanakai-usage-fee';
import { HK } from '@/lib/connection/brand/tokens';

type SquareTokenResult = { status: string; token?: string; errors?: unknown[] };
type SquareCard = {
  attach: (selectorOrElement: string | HTMLElement) => Promise<void>;
  tokenize: (details?: Record<string, unknown>) => Promise<SquareTokenResult>;
  destroy?: () => Promise<void> | void;
};

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<SquareCard>;
      };
    };
  }
}

type SquareCardRegistrationProps = {
  onSaved: (paymentMethod?: { id: string; brand: string | null; last4: string | null }) => void;
  onCancel?: () => void;
  /** When false, keep existing default (unless first card). Default true. */
  setAsDefault?: boolean;
  title?: string;
  submitLabel?: string;
  compact?: boolean;
};

export function SquareCardRegistration({
  onSaved,
  onCancel,
  setAsDefault = true,
  title = 'お支払い方法の登録',
  submitLabel = 'カードを保存して続ける',
  compact = false,
}: SquareCardRegistrationProps) {
  const containerId = useId().replace(/:/g, '');
  const config = getPublicSquareConfig();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remount after Square.js is already on the page (変更 → 新しいカードを追加)
  // must start ready: Script onLoad will not fire again for a cached script.
  const [sdkReady, setSdkReady] = useState(
    () => typeof window !== 'undefined' && typeof window.Square !== 'undefined',
  );
  const [cardReady, setCardReady] = useState(false);
  // The SAME card instance must be used for attach() and tokenize(); a freshly
  // created payments.card() has no attached iframe fields and always fails.
  const cardRef = useRef<SquareCard | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const markSdkReady = useCallback(() => {
    if (typeof window !== 'undefined' && window.Square) {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (!sdkReady || !window.Square || !config.applicationId || !config.locationId) return;
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let localCard: SquareCard | null = null;

    setError(null);
    setCardReady(false);

    (async () => {
      try {
        const payments = window.Square!.payments(config.applicationId, config.locationId);
        const card = await payments.card();
        if (cancelled) {
          await card.destroy?.();
          return;
        }
        // Attach to the live element (not only a selector) so remounts never
        // target a detached node from a previous "新しいカードを追加" open.
        await card.attach(el);
        if (cancelled) {
          await card.destroy?.();
          return;
        }
        localCard = card;
        cardRef.current = card;
        if (!cancelled) setCardReady(true);
      } catch {
        if (!cancelled) setError('カード入力フォームの読み込みに失敗しました');
      }
    })();

    return () => {
      cancelled = true;
      setCardReady(false);
      const toDestroy = localCard ?? cardRef.current;
      cardRef.current = null;
      if (toDestroy) {
        try {
          void toDestroy.destroy?.();
        } catch {
          // ignore teardown errors
        }
      }
      // Ensure no stale Square iframes remain if destroy is async/no-op.
      el.replaceChildren();
    };
  }, [sdkReady, config.applicationId, config.locationId, containerId]);

  const handleSave = useCallback(async () => {
    if (!consent) {
      setError('同意が必要です');
      return;
    }
    const card = cardRef.current;
    if (!card) {
      setError('カード入力フォームが初期化されていません。少し待って再度お試しください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tokenize the SAME attached card instance the user typed into.
      const tokenResult = await card.tokenize();

      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        throw new Error('カード情報を確認してください');
      }

      const res = await fetch('/api/hanakai/payments/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          consentAccepted: true,
          platform: 'web',
          setAsDefault,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        paymentMethod?: { id: string; brand: string | null; last4: string | null };
      };
      if (!res.ok || !data.ok || !data.paymentMethod) {
        throw new Error(data.error ?? 'カードの保存に失敗しました');
      }

      onSaved(data.paymentMethod);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カードの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [consent, onSaved, setAsDefault]);

  const sdkUrl =
    config.environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return (
    <div className='space-y-4'>
      <Script
        src={sdkUrl}
        strategy='afterInteractive'
        onLoad={markSdkReady}
        // Fires on remount even when Square.js is already cached in the document.
        onReady={markSdkReady}
      />

      <div>
        <h2 className='text-lg font-semibold text-[#1a1a1a]'>{title}</h2>
        {compact ? (
          <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
            カード番号は Square に安全に送信され、HANAKAI には保存されません。
          </p>
        ) : (
          <>
            <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
              参加メンバーに選ばれた場合のみ、{HANAKAI_USAGE_FEE_LABEL}
              {formatHanakaiUsageFee()}を登録済みのカードへ自動請求します。
            </p>
            <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>選ばれなかった場合、請求は発生しません。</p>
            <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
              飲食代・材料費・施設利用料など、イベント当日に必要な費用は含まれません。イベント詳細をご確認のうえ、当日、主催者または店舗へ直接お支払いください。
            </p>
          </>
        )}
      </div>

      <div
        id={containerId}
        ref={containerRef}
        className='min-h-[56px] rounded-2xl border border-[#ddd9d1] bg-white px-3 py-3'
      />

      <label className='flex items-start gap-3 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3 text-sm leading-7 text-[#4a4a4a]'>
        <input
          type='checkbox'
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className='mt-1 h-4 w-4 shrink-0 accent-[#1f5d4f]'
        />
        <span>{PAYMENT_CONSENT_TEXT}</span>
      </label>

      {error ? <p className='text-sm text-rose-700'>{error}</p> : null}

      <div className='flex flex-col gap-2 sm:flex-row'>
        <button
          type='button'
          disabled={!consent || !cardReady || loading}
          onClick={handleSave}
          className='inline-flex h-12 flex-1 items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-40'
          style={{ backgroundColor: HK.green }}
        >
          {loading ? '保存中…' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type='button'
            onClick={onCancel}
            className='inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b]'
          >
            戻る
          </button>
        ) : null}
      </div>
    </div>
  );
}
