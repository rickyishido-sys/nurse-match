'use client';

import { useMemo } from 'react';
import { calculateReferralFee } from '@/lib/connection/event-operations/fee-calculator';

type Props = {
  hanakaiCheckinCount: number;
  totalParticipants: number;
  grossSalesTaxIncluded: number;
  salesTaxRate: number;
  billingTaxRate: number;
};

export function RevenueFeeCalculator({
  hanakaiCheckinCount,
  totalParticipants,
  grossSalesTaxIncluded,
  salesTaxRate,
  billingTaxRate,
}: Props) {
  const breakdown = useMemo(() => {
    try {
      return calculateReferralFee({
        totalParticipants: Math.max(0, totalParticipants),
        hanakaiCheckinCount,
        grossSalesTaxIncluded: Math.max(0, grossSalesTaxIncluded),
        salesTaxRate,
        billingTaxRate,
      });
    } catch {
      return null;
    }
  }, [hanakaiCheckinCount, totalParticipants, grossSalesTaxIncluded, salesTaxRate, billingTaxRate]);

  if (totalParticipants <= 0) {
    return (
      <div className='rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-4 text-xs text-[#9a9a9a]'>
        実参加人数を入力すると、送客サービス利用料が自動計算されます。
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-xs text-rose-700'>
        HANAKAIチェックイン人数が総実参加人数を超えています。入力を見直してください。
      </div>
    );
  }

  return (
    <div className='space-y-4 rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-5 py-5'>
      <p className='text-sm font-semibold text-[#1f5d4f]'>送客サービス利用料（自動計算）</p>
      <dl className='grid gap-2 text-sm sm:grid-cols-2'>
        <CalcRow label='実参加人数' value={`${breakdown.totalParticipants}人`} />
        <CalcRow label='HANAKAIチェックイン' value={`${breakdown.hanakaiCheckinCount}人`} />
        <CalcRow label='税抜売上' value={`¥${breakdown.grossSalesTaxExcluded.toLocaleString()}`} />
        <CalcRow label='送客割合' value={`${(breakdown.referralRatio * 100).toFixed(1)}%`} />
        <CalcRow label='HANAKAI対象売上' value={`¥${breakdown.hanakaiTargetSales.toLocaleString()}`} />
        <CalcRow label='利用料（税抜）' value={`¥${breakdown.serviceFeeTaxExcluded.toLocaleString()}`} />
        <CalcRow label='消費税' value={`¥${breakdown.taxAmount.toLocaleString()}`} />
        <CalcRow label='請求額（税込）' value={`¥${breakdown.totalAmountTaxIncluded.toLocaleString()}`} highlight />
      </dl>
      <div className='space-y-1.5 rounded-xl bg-white/70 px-4 py-3'>
        <p className='text-[11px] font-semibold text-[#6b6b6b]'>計算根拠</p>
        {breakdown.formulaNotes.map((note) => (
          <p key={note} className='text-[11px] leading-6 text-[#6b6b6b]'>
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}

function CalcRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className='flex justify-between gap-3 rounded-lg bg-white/60 px-3 py-2'>
      <dt className='text-xs text-[#6b6b6b]'>{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-[#1f5d4f]' : 'text-[#1a1a1a]'}`}>{value}</dd>
    </div>
  );
}
