'use client';

import Script from 'next/script';
import { useCallback, useEffect, useId, useState } from 'react';
import { getPublicSquareConfig, PAYMENT_CONSENT_TEXT } from '@/lib/square/public-config';
import { HANAKAI_PARTICIPATION_FEE_LABEL, formatHanakaiParticipationFee } from '@/lib/connection/participation-fee';
import { HK } from '@/lib/connection/brand/tokens';

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: (details?: Record<string, unknown>) => Promise<{
            status: string;
            token?: string;
            errors?: unknown[];
          }>;
        }>;
      };
    };
  }
}

type SquareCardRegistrationProps = {
  onSaved: () => void;
  onCancel?: () => void;
};

export function SquareCardRegistration({ onSaved, onCancel }: SquareCardRegistrationProps) {
  const containerId = useId().replace(/:/g, '');
  const config = getPublicSquareConfig();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    if (!sdkReady || !window.Square || !config.applicationId || !config.locationId) return;
    let cancelled = false;

    (async () => {
      try {
        const payments = window.Square!.payments(config.applicationId, config.locationId);
        const card = await payments.card();
        await card.attach(`#${containerId}`);
        if (!cancelled) setCardReady(true);
      } catch {
        if (!cancelled) setError('カード入力フォームの読み込みに失敗しました');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdkReady, config.applicationId, config.locationId, containerId]);

  const handleSave = useCallback(async () => {
    if (!consent) {
      setError('同意が必要です');
      return;
    }
    if (!window.Square || !config.applicationId || !config.locationId) {
      setError('決済設定が完了していません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payments = window.Square.payments(config.applicationId, config.locationId);
      const card = await payments.card();
      const tokenResult = await card.tokenize({
        intent: 'STORE',
        customerInitiated: true,
        sellerKeyedIn: false,
      });

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
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'カードの保存に失敗しました');
      }

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カードの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [consent, config.applicationId, config.locationId, onSaved]);

  const sdkUrl =
    config.environment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return (
    <div className='space-y-4'>
      <Script src={sdkUrl} strategy='afterInteractive' onLoad={() => setSdkReady(true)} />

      <div>
        <h2 className='text-lg font-semibold text-[#1a1a1a]'>お支払い方法の登録</h2>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
          参加メンバーに選ばれた場合のみ、{HANAKAI_PARTICIPATION_FEE_LABEL}
          {formatHanakaiParticipationFee()}を登録済みのカードへ自動請求します。
        </p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>選ばれなかった場合、請求は発生しません。</p>
        <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
          飲食代・材料費・施設利用料など、イベント当日に必要な費用は含まれません。イベント詳細をご確認のうえ、当日、主催者または店舗へ直接お支払いください。
        </p>
      </div>

      <div id={containerId} className='min-h-[56px] rounded-2xl border border-[#ddd9d1] bg-white px-3 py-3' />

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
          {loading ? '保存中…' : 'カードを保存して続ける'}
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
