'use client';

import { useMemo, useState } from 'react';
import type { EventFeeType } from '@/lib/connection/types';
import {
  DEFAULT_EVENT_FEE_FORM,
  EVENT_FEE_TYPE_LABEL,
  type EventFeeFormValues,
  formatEventFeeDisplay,
} from '@/lib/connection/event-fee-meta';
import { EventFeeCards, CreateEventHanakaiFeeNotice } from '@/components/connection/events/event-fee-ui';

const labelClass = 'mb-2 block text-sm font-semibold text-[#1a1a1a]';
const fieldClass =
  'w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15';
const helpClass = 'mt-1.5 text-xs text-[#9a9a9a]';

type EventFeeFieldsProps = {
  values?: EventFeeFormValues;
  onChange?: (values: EventFeeFormValues) => void;
};

export function EventFeeFields({ values: controlled, onChange }: EventFeeFieldsProps) {
  const [internal, setInternal] = useState<EventFeeFormValues>(DEFAULT_EVENT_FEE_FORM);
  const values = controlled ?? internal;

  const setValues = (next: EventFeeFormValues) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const patch = (partial: Partial<EventFeeFormValues>) => setValues({ ...values, ...partial });

  const previewLabel = useMemo(() => formatEventFeeDisplay(values), [values]);

  return (
    <div className='space-y-5'>
      <CreateEventHanakaiFeeNotice />

      <div>
        <label htmlFor='eventFeeType' className={labelClass}>
          イベント参加費タイプ
        </label>
        <select
          id='eventFeeType'
          name='eventFeeType'
          value={values.eventFeeType}
          onChange={(e) => patch({ eventFeeType: e.target.value as EventFeeType })}
          className={fieldClass}
        >
          {(Object.keys(EVENT_FEE_TYPE_LABEL) as EventFeeType[]).map((key) => (
            <option key={key} value={key}>
              {EVENT_FEE_TYPE_LABEL[key]}
            </option>
          ))}
        </select>
      </div>

      {(values.eventFeeType === 'fixed' || values.eventFeeType === 'estimate') && (
        <div>
          <label htmlFor='eventFeeAmount' className={labelClass}>
            {values.eventFeeType === 'estimate' ? '概算金額（円）' : '金額（円）'}
          </label>
          <input
            id='eventFeeAmount'
            name='eventFeeAmount'
            type='number'
            min={0}
            step={100}
            value={values.eventFeeAmount || ''}
            onChange={(e) => patch({ eventFeeAmount: Number(e.target.value) || 0 })}
            className={fieldClass}
          />
        </div>
      )}

      {values.eventFeeType === 'range' && (
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label htmlFor='eventFeeMin' className={labelClass}>
              最小金額（円）
            </label>
            <input
              id='eventFeeMin'
              name='eventFeeMin'
              type='number'
              min={0}
              step={100}
              value={values.eventFeeMin || ''}
              onChange={(e) => patch({ eventFeeMin: Number(e.target.value) || 0 })}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor='eventFeeMax' className={labelClass}>
              最大金額（円）
            </label>
            <input
              id='eventFeeMax'
              name='eventFeeMax'
              type='number'
              min={0}
              step={100}
              value={values.eventFeeMax || ''}
              onChange={(e) => patch({ eventFeeMax: Number(e.target.value) || 0 })}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label htmlFor='eventFeePaymentRecipient' className={labelClass}>
            支払先
          </label>
          <input
            id='eventFeePaymentRecipient'
            name='eventFeePaymentRecipient'
            placeholder='例：店舗レジ / 主催者'
            value={values.eventFeePaymentRecipient}
            onChange={(e) => patch({ eventFeePaymentRecipient: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor='eventFeePaymentMethod' className={labelClass}>
            支払方法
          </label>
          <input
            id='eventFeePaymentMethod'
            name='eventFeePaymentMethod'
            placeholder='例：当日現地払い（現金・PayPay等）'
            value={values.eventFeePaymentMethod}
            onChange={(e) => patch({ eventFeePaymentMethod: e.target.value })}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor='eventFeeIncludes' className={labelClass}>
          費用に含まれるもの
        </label>
        <textarea
          id='eventFeeIncludes'
          name='eventFeeIncludes'
          rows={2}
          value={values.eventFeeIncludes}
          onChange={(e) => patch({ eventFeeIncludes: e.target.value })}
          placeholder='例：花材・ドリンク1杯'
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor='eventFeeExcludes' className={labelClass}>
          費用に含まれないもの
        </label>
        <textarea
          id='eventFeeExcludes'
          name='eventFeeExcludes'
          rows={2}
          value={values.eventFeeExcludes}
          onChange={(e) => patch({ eventFeeExcludes: e.target.value })}
          placeholder='例：追加ドリンク・交通費'
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor='eventFeeNotes' className={labelClass}>
          参加者への補足
        </label>
        <textarea
          id='eventFeeNotes'
          name='eventFeeNotes'
          rows={3}
          value={values.eventFeeNotes}
          onChange={(e) => patch({ eventFeeNotes: e.target.value })}
          placeholder='例：当日受付で現金またはPayPayでお支払いください'
          className={fieldClass}
        />
        <p className={helpClass}>未確定・変動の場合は、こちらに詳細を記載してください。</p>
      </div>

      <input type='hidden' name='fee' value={values.eventFeeType === 'fixed' ? values.eventFeeAmount : 0} />

      <div>
        <p className='mb-2 text-xs font-semibold tracking-wide text-[#9a9a9a]'>参加者向けプレビュー</p>
        <EventFeeCards
          eventFeeLabel={previewLabel}
          eventFeeType={values.eventFeeType}
          eventFeeIncludes={values.eventFeeIncludes}
          eventFeeExcludes={values.eventFeeExcludes}
          eventFeeNotes={values.eventFeeNotes}
        />
      </div>
    </div>
  );
}

export type { EventFeeFormValues };
