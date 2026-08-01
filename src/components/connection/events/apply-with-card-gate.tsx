'use client';

import { useState } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import { ApplyForm } from '@/components/connection/events/apply-form';

export function ApplyWithCardGate({
  eventId,
  approvalMode,
  hasPaymentMethod,
}: {
  eventId: string;
  approvalMode: 'host_approval' | 'auto';
  hasPaymentMethod: boolean;
}) {
  const [ready, setReady] = useState(hasPaymentMethod);

  if (!ready) {
    return <SquareCardRegistration onSaved={() => setReady(true)} />;
  }

  return <ApplyForm eventId={eventId} approvalMode={approvalMode} />;
}
