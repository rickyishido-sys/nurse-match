'use client';

import { useState } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import {
  formatPaymentMethodLine,
  type PaymentMethodDisplay,
} from '@/lib/connection/payment-method-display';
import { formatHanakaiUsageFee, HANAKAI_USAGE_FEE_LABEL } from '@/lib/connection/hanakai-usage-fee';

type Props = {
  methods: PaymentMethodDisplay[];
  selectedId: string;
  onChange: (id: string) => void;
  onMethodsUpdated: (methods: PaymentMethodDisplay[], selectedId: string) => void;
  usageFeeJpy?: number;
  /** When multiple cards exist, open the picker so the user can confirm selection. */
  preferPickerOpen?: boolean;
};

export function ApplyPaymentMethodField({
  methods,
  selectedId,
  onChange,
  onMethodsUpdated,
  usageFeeJpy,
  preferPickerOpen = false,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(preferPickerOpen && methods.length > 1);
  const [adding, setAdding] = useState(false);
  const selected = methods.find((m) => m.id === selectedId) ?? methods[0];

  if (!selected) return null;

  return (
    <div className='space-y-3 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold tracking-wide text-[#8a8a8a]'>
            今回のお支払い方法
          </p>
          <p className='mt-1 text-sm font-semibold text-[#1a1a1a]'>
            {formatPaymentMethodLine(selected)}
          </p>
          {methods.length > 1 ? (
            <p className='mt-1 text-xs text-[#8a8a8a]'>
              登録カードが複数あります。必要なら変更できます。
            </p>
          ) : null}
        </div>
        <button
          type='button'
          onClick={() => {
            setPickerOpen((v) => !v);
            setAdding(false);
          }}
          className='shrink-0 text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'
        >
          {pickerOpen ? '閉じる' : methods.length > 1 ? 'カードを選ぶ' : '変更'}
        </button>
      </div>

      <p className='text-xs leading-6 text-[#6b6b6b]'>
        参加メンバーに選ばれた場合のみ、このカードに{HANAKAI_USAGE_FEE_LABEL}
        {formatHanakaiUsageFee(usageFeeJpy)}が請求されます。選ばれなかった場合、請求は発生しません。
      </p>

      <input type='hidden' name='paymentMethodId' value={selected.id} />

      {pickerOpen ? (
        <div className='space-y-2 border-t border-[#ebe9e4] pt-3'>
          {methods.map((m) => {
            const active = m.id === selected.id;
            return (
              <button
                key={m.id}
                type='button'
                onClick={() => {
                  onChange(m.id);
                  setPickerOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm ${
                  active
                    ? 'border-[#1f5d4f] bg-white'
                    : 'border-[#ebe9e4] bg-white hover:border-[#d8d6d1]'
                }`}
              >
                <span className='font-medium text-[#1a1a1a]'>{formatPaymentMethodLine(m)}</span>
                {m.isDefault ? (
                  <span className='rounded-full bg-[#eef4f0] px-2 py-0.5 text-[10px] font-semibold text-[#1f5d4f]'>
                    デフォルト
                  </span>
                ) : null}
              </button>
            );
          })}

          {!adding ? (
            <button
              type='button'
              onClick={() => setAdding(true)}
              className='w-full rounded-2xl border border-dashed border-[#d8d6d1] px-3 py-3 text-sm font-semibold text-[#1f5d4f]'
            >
              ＋ 新しいカードを追加
            </button>
          ) : (
            <SquareCardRegistration
              compact
              setAsDefault={false}
              title='新しいカードを追加'
              submitLabel='このカードを追加'
              onCancel={() => setAdding(false)}
              onSaved={(pm) => {
                if (!pm) return;
                const next: PaymentMethodDisplay = {
                  id: pm.id,
                  brand: pm.brand,
                  last4: pm.last4,
                  isDefault: false,
                };
                onMethodsUpdated([...methods, next], pm.id);
                setAdding(false);
                setPickerOpen(false);
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
