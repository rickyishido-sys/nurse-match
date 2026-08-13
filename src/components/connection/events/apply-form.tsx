'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { applyConnectionEventAction } from '@/lib/connection/actions';
import {
  EVENT_APPLICATION_REASON_MAX,
  EVENT_APPLICATION_REASON_MIN,
} from '@/lib/connection/types';
import { ApplyFeeNotice } from '@/components/connection/events/event-fee-ui';
import { ApplyPaymentMethodField } from '@/components/connection/payments/apply-payment-method-field';
import type { PaymentMethodDisplay } from '@/lib/connection/payment-method-display';

export function ApplyForm({
  eventId,
  approvalMode,
  paymentMethods,
  usageFeeJpy,
}: {
  eventId: string;
  approvalMode: 'host_approval' | 'auto';
  paymentMethods: PaymentMethodDisplay[];
  usageFeeJpy?: number;
}) {
  const [reason, setReason] = useState('');
  const [methods, setMethods] = useState(paymentMethods);
  const defaultId = paymentMethods.find((m) => m.isDefault)?.id ?? paymentMethods[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(defaultId);
  const count = reason.trim().length;
  const reasonTooShort = count < EVENT_APPLICATION_REASON_MIN;
  const reasonTooLong = count > EVENT_APPLICATION_REASON_MAX;
  const hasCard = Boolean(selectedId);
  const valid = !reasonTooShort && !reasonTooLong && hasCard;

  let disableHint: string | null = null;
  if (!valid) {
    if (!hasCard) disableHint = 'お支払い方法を選択してください。';
    else if (count === 0) {
      disableHint = `参加理由を${EVENT_APPLICATION_REASON_MIN}文字以上入力すると申請できます。`;
    } else if (reasonTooShort) {
      disableHint = `参加理由があと${EVENT_APPLICATION_REASON_MIN - count}文字不足しています（${EVENT_APPLICATION_REASON_MIN}文字以上）。`;
    } else if (reasonTooLong) {
      disableHint = `参加理由は${EVENT_APPLICATION_REASON_MAX}文字以内にしてください。`;
    }
  }

  return (
    <form action={applyConnectionEventAction} className='space-y-4 pb-8 sm:pb-0'>
      <input type='hidden' name='eventId' value={eventId} />

      <div>
        <label htmlFor='reason' className='mb-2 block text-sm font-semibold text-[#1a1a1a]'>
          参加理由
          <span className='ml-2 text-xs font-normal text-[#9a9a9a]'>必須</span>
        </label>
        <textarea
          id='reason'
          name='reason'
          rows={5}
          maxLength={EVENT_APPLICATION_REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='「最近花に興味を持ちました。」&#10;「色々な方と話してみたいと思っています。」'
          className='w-full resize-none rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm leading-7 text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15'
        />
        <div className='mt-1.5 flex items-center justify-between gap-3 text-xs'>
          <span className='text-[#9a9a9a]'>
            {approvalMode === 'auto'
              ? 'この想いを添えて参加できます。'
              : '主催者がこの想いを読んで参加者を選びます。'}
          </span>
          <span
            className={
              reasonTooLong || (count > 0 && reasonTooShort)
                ? 'shrink-0 text-[#c0526b]'
                : 'shrink-0 text-[#9a9a9a]'
            }
          >
            {count} / {EVENT_APPLICATION_REASON_MIN}〜{EVENT_APPLICATION_REASON_MAX}
          </span>
        </div>
      </div>

      <ApplyPaymentMethodField
        methods={methods}
        selectedId={selectedId}
        onChange={setSelectedId}
        usageFeeJpy={usageFeeJpy}
        preferPickerOpen={methods.length > 1}
        onMethodsUpdated={(next, id) => {
          setMethods(next);
          setSelectedId(id);
        }}
      />

      <ApplyFeeNotice />

      {disableHint ? (
        <p className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          {disableHint}
        </p>
      ) : (
        <p className='text-xs leading-6 text-[#6b6b6b]'>
          「参加申請する」を押すと申請が送信されます。この時点では課金されません。
        </p>
      )}

      <motion.button
        type='submit'
        whileTap={{ scale: 0.98 }}
        disabled={!valid}
        className='flex min-h-12 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a4f44] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40'
      >
        {approvalMode === 'auto' ? '参加する' : '参加申請する'}
      </motion.button>
    </form>
  );
}
