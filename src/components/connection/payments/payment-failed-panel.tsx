'use client';

import { useState, useTransition } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import { formatHanakaiParticipationFee, HANAKAI_PARTICIPATION_FEE_LABEL } from '@/lib/connection/participation-fee';
import { HK } from '@/lib/connection/brand/tokens';

type PaymentFailedPanelProps = {
  paymentId: string;
  brand?: string | null;
  last4?: string | null;
  deadlineAt?: string | null;
  failureMessage?: string | null;
};

export function PaymentFailedPanel({
  paymentId,
  brand,
  last4,
  deadlineAt,
  failureMessage,
}: PaymentFailedPanelProps) {
  const [showCardForm, setShowCardForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const retry = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch('/api/hanakai/payments/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) setMessage(data.error ?? '再決済に失敗しました');
      else window.location.reload();
    });
  };

  if (showCardForm) {
    return (
      <SquareCardRegistration
        onSaved={() => {
          setShowCardForm(false);
          retry();
        }}
        onCancel={() => setShowCardForm(false)}
      />
    );
  }

  return (
    <div className='space-y-4 rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-5 py-5'>
      <h3 className='text-base font-semibold text-[#1a1a1a]'>お支払い方法をご確認ください</h3>
      <p className='text-sm leading-7 text-[#4a4a4a]'>
        参加メンバーに選ばれましたが、登録済みカードで{HANAKAI_PARTICIPATION_FEE_LABEL}
        {formatHanakaiParticipationFee()}を決済できませんでした。期限までにカード情報を更新し、再決済してください。
      </p>
      {brand && last4 ? (
        <p className='text-sm text-[#6b6b6b]'>
          登録カード: {brand} •••• {last4}
        </p>
      ) : null}
      {deadlineAt ? (
        <p className='text-sm font-medium' style={{ color: HK.green }}>
          支払期限: {new Date(deadlineAt).toLocaleString('ja-JP')}
        </p>
      ) : null}
      {failureMessage ? <p className='text-sm text-rose-700'>{failureMessage}</p> : null}
      {message ? <p className='text-sm text-rose-700'>{message}</p> : null}
      <div className='flex flex-col gap-2'>
        <button
          type='button'
          onClick={() => setShowCardForm(true)}
          className='inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
        >
          カードを変更する
        </button>
        <button
          type='button'
          disabled={isPending}
          onClick={retry}
          className='inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-40'
          style={{ backgroundColor: HK.green }}
        >
          {isPending ? '処理中…' : `${formatHanakaiParticipationFee()}を再決済する`}
        </button>
      </div>
    </div>
  );
}
