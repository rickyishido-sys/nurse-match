'use client';

import { useState } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import { ApplyForm } from '@/components/connection/events/apply-form';
import type { PaymentMethodDisplay } from '@/lib/connection/payment-method-display';

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

  if (methods.length === 0) {
    return (
      <SquareCardRegistration
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
        }}
      />
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
