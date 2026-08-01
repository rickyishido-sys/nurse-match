import type { EventFeeType } from '@/lib/connection/types';

export const EVENT_FEE_TYPE_LABEL: Record<EventFeeType, string> = {
  free: '無料',
  fixed: '固定額',
  estimate: '概算',
  range: '金額範囲',
  variable: '内容により変動',
  undecided: '未確定',
};

export type EventFeeFormValues = {
  eventFeeType: EventFeeType;
  eventFeeAmount: number;
  eventFeeMin: number;
  eventFeeMax: number;
  eventFeePaymentRecipient: string;
  eventFeePaymentMethod: string;
  eventFeeIncludes: string;
  eventFeeExcludes: string;
  eventFeeNotes: string;
};

export const DEFAULT_EVENT_FEE_FORM: EventFeeFormValues = {
  eventFeeType: 'undecided',
  eventFeeAmount: 0,
  eventFeeMin: 0,
  eventFeeMax: 0,
  eventFeePaymentRecipient: '',
  eventFeePaymentMethod: 'on_site',
  eventFeeIncludes: '',
  eventFeeExcludes: '',
  eventFeeNotes: '',
};

export function legacyFeeFromForm(values: EventFeeFormValues): number {
  if (values.eventFeeType === 'free') return 0;
  if (values.eventFeeType === 'fixed') return Math.max(0, values.eventFeeAmount);
  if (values.eventFeeType === 'estimate') return Math.max(0, values.eventFeeAmount);
  if (values.eventFeeType === 'range') return Math.max(0, values.eventFeeMin || values.eventFeeMax);
  return 0;
}

export function formatEventFeeDisplay(values: Pick<EventFeeFormValues, 'eventFeeType' | 'eventFeeAmount' | 'eventFeeMin' | 'eventFeeMax' | 'eventFeeNotes'>): string {
  switch (values.eventFeeType) {
    case 'free':
      return '無料';
    case 'fixed':
      return values.eventFeeAmount > 0 ? `${values.eventFeeAmount.toLocaleString('ja-JP')}円` : 'イベント詳細をご確認ください';
    case 'estimate':
      return values.eventFeeAmount > 0 ? `概算 ${values.eventFeeAmount.toLocaleString('ja-JP')}円` : '概算（詳細はイベント説明をご確認ください）';
    case 'range':
      if (values.eventFeeMin > 0 && values.eventFeeMax > 0) {
        return `${values.eventFeeMin.toLocaleString('ja-JP')}〜${values.eventFeeMax.toLocaleString('ja-JP')}円`;
      }
      return '金額範囲（詳細はイベント説明をご確認ください）';
    case 'variable':
      return '内容により変動';
    case 'undecided':
    default:
      return values.eventFeeNotes.trim() || 'イベント詳細をご確認ください';
  }
}

export function eventFeeMetaFromForm(values: EventFeeFormValues) {
  return {
    eventFeeType: values.eventFeeType,
    eventFeeAmount: values.eventFeeType === 'fixed' || values.eventFeeType === 'estimate' ? values.eventFeeAmount : null,
    eventFeeMin: values.eventFeeType === 'range' ? values.eventFeeMin : null,
    eventFeeMax: values.eventFeeType === 'range' ? values.eventFeeMax : null,
    eventFeePaymentRecipient: values.eventFeePaymentRecipient.trim() || null,
    eventFeePaymentMethod: values.eventFeePaymentMethod.trim() || 'on_site',
    eventFeeIncludes: values.eventFeeIncludes.trim() || null,
    eventFeeExcludes: values.eventFeeExcludes.trim() || null,
    eventFeeNotes: values.eventFeeNotes.trim() || null,
    fee: legacyFeeFromForm(values),
  };
}

export function eventFeeFormFromEvent(event: {
  fee?: number;
  eventFeeType?: EventFeeType | null;
  eventFeeAmount?: number | null;
  eventFeeMin?: number | null;
  eventFeeMax?: number | null;
  eventFeePaymentRecipient?: string | null;
  eventFeePaymentMethod?: string | null;
  eventFeeIncludes?: string | null;
  eventFeeExcludes?: string | null;
  eventFeeNotes?: string | null;
}): EventFeeFormValues {
  if (event.eventFeeType) {
    return {
      eventFeeType: event.eventFeeType,
      eventFeeAmount: event.eventFeeAmount ?? event.fee ?? 0,
      eventFeeMin: event.eventFeeMin ?? 0,
      eventFeeMax: event.eventFeeMax ?? 0,
      eventFeePaymentRecipient: event.eventFeePaymentRecipient ?? '',
      eventFeePaymentMethod: event.eventFeePaymentMethod ?? 'on_site',
      eventFeeIncludes: event.eventFeeIncludes ?? '',
      eventFeeExcludes: event.eventFeeExcludes ?? '',
      eventFeeNotes: event.eventFeeNotes ?? '',
    };
  }
  const fee = event.fee ?? 0;
  return {
    ...DEFAULT_EVENT_FEE_FORM,
    eventFeeType: fee > 0 ? 'fixed' : 'undecided',
    eventFeeAmount: fee,
  };
}
