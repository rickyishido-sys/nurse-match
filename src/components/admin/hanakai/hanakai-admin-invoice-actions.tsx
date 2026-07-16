'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminUpdateInvoicePaymentAction } from '@/lib/connection/event-operations/actions';
import type { EventInvoice } from '@/lib/connection/event-operations/types';
import { INVOICE_PAYMENT_STATUS_LABEL } from '@/lib/connection/event-operations/types';

type Props = {
  invoice: EventInvoice;
  eventTitle: string;
};

export function HanakaiAdminInvoiceActions({ invoice, eventTitle }: Props) {
  const [mode, setMode] = useState<'idle' | 'memo' | 'paid'>('idle');
  const [adminMemo, setAdminMemo] = useState(invoice.adminMemo ?? '');

  if (mode === 'memo' || mode === 'paid') {
    return (
      <form action={adminUpdateInvoicePaymentAction} className='space-y-2'>
        <input type='hidden' name='invoiceId' value={invoice.id} />
        <input type='hidden' name='paymentStatus' value={mode === 'paid' ? 'paid' : invoice.paymentStatus} />
        <textarea
          name='adminMemo'
          value={adminMemo}
          onChange={(e) => setAdminMemo(e.target.value)}
          rows={2}
          placeholder='内部メモ'
          className='w-full max-w-[280px] rounded-xl border border-[#e2ddd2] px-2 py-1.5 text-[11px]'
        />
        <div className='flex flex-wrap gap-2'>
          <button type='submit' className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'>
            {mode === 'paid' ? '支払済にする' : 'メモを保存'}
          </button>
          <button type='button' onClick={() => setMode('idle')} className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#9a9a9a]'>
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {invoice.paymentStatus === 'pending' ? (
          <button type='button' onClick={() => setMode('paid')} className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'>
            支払済変更
          </button>
        ) : null}
        <button type='button' onClick={() => setMode('memo')} className='rounded-full border border-[#e2ddd2] px-3 py-1 text-[11px] text-[#6b6b6b]'>
          内部メモ
        </button>
      </div>
      <Link href={`/events/${invoice.eventId}`} className='block text-[10px] text-[#1f5d4f] hover:underline'>
        {eventTitle} →
      </Link>
      <span className='text-[10px] text-[#9a9a9a]'>{INVOICE_PAYMENT_STATUS_LABEL[invoice.paymentStatus]}</span>
    </div>
  );
}
