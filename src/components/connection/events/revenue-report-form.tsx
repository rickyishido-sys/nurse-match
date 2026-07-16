'use client';

import { useState } from 'react';
import { RevenueFeeCalculator } from '@/components/connection/events/revenue-fee-calculator';
import { submitRevenueReportAction } from '@/lib/connection/event-operations/actions';

type Props = {
  eventId: string;
  eventTitle: string;
  hanakaiCheckinCount: number;
  defaultSalesTaxRate?: number;
  defaultBillingTaxRate?: number;
};

export function RevenueReportForm({
  eventId,
  eventTitle,
  hanakaiCheckinCount,
  defaultSalesTaxRate = 0.1,
  defaultBillingTaxRate = 0.1,
}: Props) {
  const [totalParticipants, setTotalParticipants] = useState(14);
  const [grossSalesTaxIncluded, setGrossSalesTaxIncluded] = useState(55000);
  const [salesTaxRate, setSalesTaxRate] = useState(defaultSalesTaxRate);
  const [billingTaxRate, setBillingTaxRate] = useState(defaultBillingTaxRate);

  return (
    <form action={submitRevenueReportAction} className='space-y-6' encType='multipart/form-data'>
      <input type='hidden' name='eventId' value={eventId} />

      <p className='text-sm leading-7 text-[#4a4a4a]'>
        「{eventTitle}」の売上をご報告ください。HANAKAIチェックイン {hanakaiCheckinCount}人をもとに、送客サービス利用料を自動計算します。
      </p>

      <div className='grid gap-5 sm:grid-cols-2'>
        <Field label='イベント全体の実参加人数' htmlFor='totalParticipants'>
          <input
            id='totalParticipants'
            name='totalParticipants'
            type='number'
            min={1}
            required
            value={totalParticipants}
            onChange={(e) => setTotalParticipants(Number(e.target.value) || 0)}
            className={fieldClass}
          />
        </Field>
        <Field label='イベント全体の税込売上（円）' htmlFor='grossSalesTaxIncluded'>
          <input
            id='grossSalesTaxIncluded'
            name='grossSalesTaxIncluded'
            type='number'
            min={0}
            required
            value={grossSalesTaxIncluded}
            onChange={(e) => setGrossSalesTaxIncluded(Number(e.target.value) || 0)}
            className={fieldClass}
          />
        </Field>
        <Field label='売上消費税率' htmlFor='salesTaxRate'>
          <select
            id='salesTaxRate'
            name='salesTaxRate'
            value={salesTaxRate}
            onChange={(e) => setSalesTaxRate(Number(e.target.value))}
            className={fieldClass}
          >
            <option value={0.1}>10%</option>
            <option value={0.08}>8%（軽減税率）</option>
            <option value={0}>0%</option>
          </select>
        </Field>
        <Field label='請求消費税率' htmlFor='billingTaxRate'>
          <select
            id='billingTaxRate'
            name='billingTaxRate'
            value={billingTaxRate}
            onChange={(e) => setBillingTaxRate(Number(e.target.value))}
            className={fieldClass}
          >
            <option value={0.1}>10%</option>
            <option value={0.08}>8%</option>
            <option value={0}>0%</option>
          </select>
        </Field>
      </div>

      <RevenueFeeCalculator
        hanakaiCheckinCount={hanakaiCheckinCount}
        totalParticipants={totalParticipants}
        grossSalesTaxIncluded={grossSalesTaxIncluded}
        salesTaxRate={salesTaxRate}
        billingTaxRate={billingTaxRate}
      />

      <Field label='証憑（レシート・領収書・POS画面など）※必須' htmlFor='documents'>
        <input
          id='documents'
          name='documents'
          type='file'
          accept='image/jpeg,image/png,image/webp,application/pdf'
          multiple
          required
          className='w-full text-sm text-[#6b6b6b] file:mr-3 file:rounded-full file:border-0 file:bg-[#1f5d4f] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white'
        />
        <p className='mt-1.5 text-xs text-[#9a9a9a]'>画像（jpg/png/webp）またはPDF・1ファイル15MBまで</p>
      </Field>

      <Field label='補足メモ（任意）' htmlFor='notes'>
        <textarea id='notes' name='notes' rows={3} className={`${fieldClass} resize-none`} placeholder='売上の内訳など' />
      </Field>

      <button type='submit' className='w-full rounded-full bg-[#1f5d4f] py-4 text-sm font-semibold text-white'>
        売上を報告する
      </button>
    </form>
  );
}

const fieldClass =
  'w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className='mb-2 block text-sm font-semibold text-[#1a1a1a]'>
        {label}
      </label>
      {children}
    </div>
  );
}
