'use client';

import { useEffect, useState } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import { ApplyForm } from '@/components/connection/events/apply-form';
import { HANAKAI_START_APPLY_EVENT } from '@/components/connection/events/event-detail-cta';
import type { PaymentMethodDisplay } from '@/lib/connection/payment-method-display';
import { formatHanakaiUsageFee, HANAKAI_USAGE_FEE_LABEL } from '@/lib/connection/hanakai-usage-fee';

export function ApplyWithCardGate({
  eventId,
  approvalMode,
  initialMethods,
  usageFeeJpy,
}: {
  eventId: string;
  approvalMode: 'host_approval' | 'auto';
  initialMethods: PaymentMethodDisplay[];
  usageFeeJpy?: number;
}) {
  const [methods, setMethods] = useState(initialMethods);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const start = () => setStarted(true);
    window.addEventListener(HANAKAI_START_APPLY_EVENT, start);

    // Deep-link support: /events/{id}#event-apply opens the apply flow.
    let timer: number | undefined;
    if (window.location.hash === '#event-apply') {
      timer = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(HANAKAI_START_APPLY_EVENT));
      }, 0);
    }

    return () => {
      window.removeEventListener(HANAKAI_START_APPLY_EVENT, start);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!started) {
    return (
      <div className='space-y-4'>
        <p className='text-sm leading-7 text-[#4a4a4a]'>
          {methods.length > 0
            ? '参加理由を入力し、今回使うお支払い方法を確認して申請できます。この時点では課金されません。'
            : `参加申請の前に、お支払い方法の登録が必要です。登録後に申請フォームへ進みます。${HANAKAI_USAGE_FEE_LABEL}${formatHanakaiUsageFee(usageFeeJpy)}は、主催者が参加メンバーを選んだときにのみ請求されます。`}
        </p>
        <button
          type='button'
          onClick={() => setStarted(true)}
          className='flex h-12 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
        >
          {methods.length > 0 ? '参加申請をはじめる' : 'お支払い方法を登録してはじめる'}
        </button>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className='space-y-4'>
        <p className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          カード登録が完了すると、そのまま参加申請フォームへ進みます。この操作では申請作成・課金は行いません。
        </p>
        <SquareCardRegistration
          title='お支払い方法を登録'
          submitLabel='カードを登録してはじめる'
          onSaved={(pm) => {
            if (!pm) return;
            setMethods([
              {
                id: pm.id,
                brand: pm.brand,
                last4: pm.last4,
                isDefault: true,
              },
            ]);
            window.setTimeout(() => {
              document.getElementById('reason')?.focus({ preventScroll: true });
              document.getElementById('event-apply')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }, 100);
          }}
        />
      </div>
    );
  }

  return (
    <ApplyForm
      eventId={eventId}
      approvalMode={approvalMode}
      paymentMethods={methods}
      usageFeeJpy={usageFeeJpy}
    />
  );
}
