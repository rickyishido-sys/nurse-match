import 'server-only';

import { randomBytes } from 'crypto';
import {
  buildHanakaiUsageFeeChargeFailedBody,
  buildHanakaiUsageFeeChargeSuccessBody,
  buildHanakaiUsageFeePaymentNote,
  getHanakaiUsageFeeJpy,
} from '@/lib/connection/hanakai-usage-fee/server';
import {
  createSquareCard,
  createSquareCustomer,
  createSquarePayment,
  disableSquareCard,
  getSquarePayment,
  mapSquareFailureMessage,
  refundSquarePayment,
} from '@/lib/square/client';
import {
  getSquareConfig,
  getSquareEnvironment,
  PAYMENT_CONSENT_VERSION,
  type SquareEnvironment,
} from '@/lib/square/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const CHARGE_CONCURRENCY = 3;

export type PaymentMethodRow = {
  id: string;
  member_id: string;
  square_customer_id: string;
  square_card_id: string;
  brand: string | null;
  last_4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  status: string;
};

function idempotencyKey(prefix: string) {
  return `${prefix}_${randomBytes(16).toString('hex')}`.slice(0, 45);
}

export async function getDefaultPaymentMethod(memberId: string, environment?: SquareEnvironment) {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;
  const env = environment ?? getSquareEnvironment();
  const { data } = await admin
    .from('hanakai_payment_methods')
    .select('*')
    .eq('member_id', memberId)
    .eq('environment', env)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PaymentMethodRow | null) ?? null;
}

export async function listPaymentMethods(memberId: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) return [];
  const { data } = await admin
    .from('hanakai_payment_methods')
    .select('*')
    .eq('member_id', memberId)
    .eq('environment', getSquareEnvironment())
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  return (data ?? []) as PaymentMethodRow[];
}

export async function memberHasActivePaymentMethod(memberId: string) {
  const method = await getDefaultPaymentMethod(memberId);
  return Boolean(method);
}

async function getOrCreateSquareCustomer(memberId: string, nickname?: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) throw new Error('DB unavailable');

  const env = getSquareEnvironment();
  const { data: existing } = await admin
    .from('hanakai_square_customers')
    .select('*')
    .eq('member_id', memberId)
    .eq('environment', env)
    .maybeSingle();

  if (existing?.square_customer_id) {
    return existing.square_customer_id as string;
  }

  const key = idempotencyKey('cust');
  const result = await createSquareCustomer({
    idempotencyKey: key,
    referenceId: memberId,
    givenName: nickname,
  });

  if (!result.ok) {
    console.error('HANAKAI_CARD_SAVE_SQUARE_CREATECUSTOMER_ERROR', {
      status: result.status,
      codes: result.errors.map((e) => e.code),
      categories: result.errors.map((e) => e.category),
    });
    throw new Error(mapSquareFailureMessage(result.errors[0]?.code));
  }
  if (!result.data.customer?.id) {
    console.error('HANAKAI_CARD_SAVE_SQUARE_CREATECUSTOMER_NO_ID', {});
    throw new Error(mapSquareFailureMessage());
  }

  const squareCustomerId = result.data.customer.id;
  const { error: custUpsertError } = await admin.from('hanakai_square_customers').upsert(
    {
      member_id: memberId,
      square_customer_id: squareCustomerId,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_id,environment' },
  );
  if (custUpsertError) {
    console.error('HANAKAI_CARD_SAVE_CUSTOMER_UPSERT_ERROR', {
      code: custUpsertError.code,
      message: custUpsertError.message,
      details: custUpsertError.details,
      hint: custUpsertError.hint,
    });
  }

  return squareCustomerId;
}

export async function savePaymentMethodFromToken(input: {
  memberId: string;
  sourceId: string;
  verificationToken?: string;
  consentAccepted: boolean;
  platform?: 'web' | 'ios' | 'android';
  nickname?: string;
}) {
  if (!input.consentAccepted) {
    return { ok: false as const, error: '同意が必要です' };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'データベースに接続できません' };

  const env = getSquareEnvironment();
  const squareCustomerId = await getOrCreateSquareCustomer(input.memberId, input.nickname);

  const cardKey = idempotencyKey('card');
  const cardResult = await createSquareCard({
    idempotencyKey: cardKey,
    sourceId: input.sourceId,
    customerId: squareCustomerId,
    verificationToken: input.verificationToken,
  });

  if (!cardResult.ok) {
    console.error('HANAKAI_CARD_SAVE_SQUARE_CREATECARD_ERROR', {
      status: cardResult.status,
      codes: cardResult.errors.map((e) => e.code),
      categories: cardResult.errors.map((e) => e.category),
      fields: cardResult.errors.map((e) => e.field),
    });
    return { ok: false as const, error: mapSquareFailureMessage(cardResult.errors[0]?.code) };
  }

  const card = cardResult.data.card ?? {};
  const squareCardId = String(card.id ?? '');
  if (!squareCardId) return { ok: false as const, error: 'カードの保存に失敗しました' };

  await admin
    .from('hanakai_payment_methods')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('member_id', input.memberId)
    .eq('environment', env)
    .eq('is_default', true);

  const { data: method, error } = await admin
    .from('hanakai_payment_methods')
    .upsert(
      {
        member_id: input.memberId,
        square_customer_id: squareCustomerId,
        square_card_id: squareCardId,
        brand: (card.card_brand as string | undefined) ?? null,
        last_4: (card.last_4 as string | undefined) ?? null,
        exp_month: card.exp_month ? Number(card.exp_month) : null,
        exp_year: card.exp_year ? Number(card.exp_year) : null,
        cardholder_name: (card.cardholder_name as string | undefined) ?? null,
        is_default: true,
        status: 'active',
        environment: env,
        consent_version: PAYMENT_CONSENT_VERSION,
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'square_card_id,environment' },
    )
    .select('*')
    .single();

  if (error || !method) {
    console.error('HANAKAI_CARD_SAVE_DB_UPSERT_ERROR', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return { ok: false as const, error: 'カード情報の保存に失敗しました' };
  }

  await admin.from('hanakai_payment_consents').insert({
    member_id: input.memberId,
    consent_version: PAYMENT_CONSENT_VERSION,
    consent_context: 'first_event_application',
    platform: input.platform ?? 'web',
    payment_method_id: method.id,
    environment: env,
  });

  return { ok: true as const, paymentMethod: method as PaymentMethodRow };
}

async function markPaymentOutcome(input: {
  paymentId: string;
  applicationId: string;
  success: boolean;
  squarePaymentId?: string;
  failureCode?: string;
  failureMessage?: string;
}) {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const now = new Date().toISOString();
  if (input.success) {
    await admin
      .from('hanakai_participation_payments')
      .update({
        status: 'completed',
        square_payment_id: input.squarePaymentId ?? null,
        paid_at: now,
        updated_at: now,
      })
      .eq('id', input.paymentId);

    await admin
      .from('hanakai_event_applications')
      .update({
        status: 'confirmed',
        confirmed_at: now,
        confirmation_token: null,
      })
      .eq('id', input.applicationId)
      .in('status', ['payment_processing', 'payment_failed']);
  } else {
    await admin
      .from('hanakai_participation_payments')
      .update({
        status: 'failed',
        failure_code: input.failureCode ?? null,
        failure_message: input.failureMessage ?? null,
        failed_at: now,
        updated_at: now,
      })
      .eq('id', input.paymentId);

    await admin
      .from('hanakai_event_applications')
      .update({ status: 'payment_failed' })
      .eq('id', input.applicationId)
      .eq('status', 'payment_processing');
  }
}

export async function chargeParticipationPayment(paymentId: string, options?: { retry?: boolean }) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'データベースに接続できません' };

  const { data: payment } = await admin
    .from('hanakai_participation_payments')
    .select('*, hanakai_events(title)')
    .eq('id', paymentId)
    .maybeSingle();

  if (!payment) return { ok: false as const, error: '決済が見つかりません' };
  if (payment.status === 'completed') return { ok: true as const, alreadyCompleted: true as const };
  if (payment.currency !== 'JPY') {
    return { ok: false as const, error: '決済金額が不正です' };
  }
  const chargeAmountJpy = Number(payment.amount);
  if (!Number.isFinite(chargeAmountJpy) || chargeAmountJpy < 0) {
    return { ok: false as const, error: '決済金額が不正です' };
  }

  const method = await getDefaultPaymentMethod(payment.member_id, payment.environment as SquareEnvironment);
  if (!method) {
    await markPaymentOutcome({
      paymentId,
      applicationId: payment.application_id,
      success: false,
      failureCode: 'NO_CARD',
      failureMessage: '有効なカードが登録されていません',
    });
    return { ok: false as const, error: '有効なカードが登録されていません' };
  }

  await admin
    .from('hanakai_participation_payments')
    .update({ status: 'processing', attempted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .in('status', options?.retry ? ['failed'] : ['pending', 'failed']);

  const eventTitle = (payment.hanakai_events as { title?: string } | null)?.title ?? payment.event_id;
  const payIdempotencyKey = options?.retry
    ? idempotencyKey(`pay_${payment.application_id}_${payment.attempt_number + 1}`)
    : (payment.idempotency_key as string);

  if (chargeAmountJpy === 0) {
    await markPaymentOutcome({
      paymentId,
      applicationId: payment.application_id,
      success: true,
    });
    await createParticipationNotification({
      memberId: payment.member_id,
      eventId: payment.event_id,
      type: 'participation_payment_succeeded',
      amountJpy: chargeAmountJpy,
    });
    return { ok: true as const, waived: true as const };
  }

  const result = await createSquarePayment({
    idempotencyKey: payIdempotencyKey,
    sourceId: method.square_card_id,
    customerId: method.square_customer_id,
    amountJpy: chargeAmountJpy,
    referenceId: payment.application_id,
    note: buildHanakaiUsageFeePaymentNote(String(eventTitle)),
  });

  if (!result.ok) {
    const code = result.errors[0]?.code;
    await markPaymentOutcome({
      paymentId,
      applicationId: payment.application_id,
      success: false,
      failureCode: code,
      failureMessage: mapSquareFailureMessage(code),
    });
    return { ok: false as const, error: mapSquareFailureMessage(code) };
  }

  const squarePaymentId = String(result.data.payment?.id ?? '');
  const squareStatus = String(result.data.payment?.status ?? '');

  if (squareStatus === 'COMPLETED') {
    await markPaymentOutcome({
      paymentId,
      applicationId: payment.application_id,
      success: true,
      squarePaymentId,
    });
    await createParticipationNotification({
      memberId: payment.member_id,
      eventId: payment.event_id,
      type: 'participation_payment_succeeded',
      amountJpy: chargeAmountJpy,
    });
    return { ok: true as const, squarePaymentId };
  }

  await markPaymentOutcome({
    paymentId,
    applicationId: payment.application_id,
    success: false,
    squarePaymentId: squarePaymentId || undefined,
    failureCode: squareStatus || 'UNKNOWN',
    failureMessage: '決済を完了できませんでした',
  });
  await createParticipationNotification({
    memberId: payment.member_id,
    eventId: payment.event_id,
    type: 'participation_payment_failed',
    amountJpy: chargeAmountJpy,
  });
  return { ok: false as const, error: '決済を完了できませんでした' };
}

export async function chargeParticipationPaymentsBatch(paymentIds: string[]) {
  const results: Array<{ paymentId: string; ok: boolean; error?: string }> = [];
  const queue = [...paymentIds];

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      const result = await chargeParticipationPayment(id);
      results.push({ paymentId: id, ok: result.ok, error: 'error' in result ? result.error : undefined });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CHARGE_CONCURRENCY, paymentIds.length || 1) }, () => worker()));
  return results;
}

export async function retryParticipationPayment(input: {
  paymentId: string;
  memberId: string;
}) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'データベースに接続できません' };

  const { data: payment } = await admin
    .from('hanakai_participation_payments')
    .select('*')
    .eq('id', input.paymentId)
    .eq('member_id', input.memberId)
    .maybeSingle();

  if (!payment || payment.status !== 'failed') {
    return { ok: false as const, error: '再決済できる決済がありません' };
  }

  const newKey = idempotencyKey(`retry_${payment.application_id}`);
  await admin
    .from('hanakai_participation_payments')
    .update({
      idempotency_key: newKey,
      attempt_number: Number(payment.attempt_number) + 1,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  return chargeParticipationPayment(payment.id, { retry: true });
}

export async function syncSquarePaymentFromWebhook(squarePaymentId: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'DB unavailable' };

  const remote = await getSquarePayment(squarePaymentId);
  if (!remote.ok || !remote.data.payment) return { ok: false as const, error: 'Payment not found' };

  const payment = remote.data.payment;
  const referenceId = String(payment.reference_id ?? '');
  const amount = Number((payment.amount_money as { amount?: number })?.amount ?? 0);
  const currency = String((payment.amount_money as { currency?: string })?.currency ?? '');
  const status = String(payment.status ?? '');

  if (currency !== 'JPY') {
    return { ok: false as const, error: 'Amount/currency mismatch' };
  }

  const { data: row } = await admin
    .from('hanakai_participation_payments')
    .select('*')
    .eq('application_id', referenceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false as const, error: 'Local payment not found' };
  if (Number(row.amount) !== amount) {
    return { ok: false as const, error: 'Amount/currency mismatch' };
  }

  if (status === 'COMPLETED') {
    await markPaymentOutcome({
      paymentId: row.id,
      applicationId: row.application_id,
      success: true,
      squarePaymentId,
    });
    return { ok: true as const, status: 'confirmed' as const };
  }

  if (status === 'FAILED' || status === 'CANCELED') {
    await markPaymentOutcome({
      paymentId: row.id,
      applicationId: row.application_id,
      success: false,
      squarePaymentId,
      failureCode: status,
    });
    return { ok: true as const, status: 'payment_failed' as const };
  }

  return { ok: true as const, status: 'ignored' as const };
}

export async function adminRefundParticipationPayment(paymentId: string, adminMemberId: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'DB unavailable' };

  const { data: payment } = await admin
    .from('hanakai_participation_payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();

  if (!payment?.square_payment_id || payment.status !== 'completed') {
    return { ok: false as const, error: '返金対象の決済がありません' };
  }

  const refundKey = idempotencyKey(`ref_${payment.id}`);
  const refundAmountJpy = Number(payment.amount);
  const result = await refundSquarePayment({
    idempotencyKey: refundKey,
    paymentId: payment.square_payment_id,
    amountJpy: refundAmountJpy,
    reason: `Admin refund by ${adminMemberId}`,
  });

  if (!result.ok) {
    return { ok: false as const, error: mapSquareFailureMessage(result.errors[0]?.code) };
  }

  const now = new Date().toISOString();
  await admin
    .from('hanakai_participation_payments')
    .update({
      status: 'refunded',
      refunded_at: now,
      square_refund_id: String(result.data.refund?.id ?? ''),
      updated_at: now,
    })
    .eq('id', payment.id);

  await admin
    .from('hanakai_event_applications')
    .update({ status: 'refunded' })
    .eq('id', payment.application_id);

  return { ok: true as const };
}

export async function disableMemberPaymentMethod(input: {
  memberId: string;
  paymentMethodId: string;
}) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'DB unavailable' };

  const { count } = await admin
    .from('hanakai_event_applications')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', input.memberId)
    .in('status', ['payment_processing', 'payment_failed']);

  const { data: methods } = await admin
    .from('hanakai_payment_methods')
    .select('id')
    .eq('member_id', input.memberId)
    .eq('status', 'active');

  if ((count ?? 0) > 0 && (methods?.length ?? 0) <= 1) {
    return { ok: false as const, error: '未決済の参加選定があるため、代替カードを登録してから削除してください' };
  }

  const { data: method } = await admin
    .from('hanakai_payment_methods')
    .select('*')
    .eq('id', input.paymentMethodId)
    .eq('member_id', input.memberId)
    .maybeSingle();

  if (!method) return { ok: false as const, error: 'カードが見つかりません' };

  await disableSquareCard(method.square_card_id);
  await admin
    .from('hanakai_payment_methods')
    .update({ status: 'disabled', disabled_at: new Date().toISOString(), is_default: false })
    .eq('id', method.id);

  return { ok: true as const };
}

async function createParticipationNotification(input: {
  memberId: string;
  eventId: string;
  type: 'participation_payment_succeeded' | 'participation_payment_failed' | 'participation_payment_expiring' | 'participation_payment_expired';
  amountJpy?: number;
}) {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const amountJpy = input.amountJpy ?? (await getHanakaiUsageFeeJpy());

  const copy = {
    participation_payment_succeeded: {
      title: '参加が決定しました',
      body: buildHanakaiUsageFeeChargeSuccessBody(amountJpy),
    },
    participation_payment_failed: {
      title: 'お支払い方法をご確認ください',
      body: buildHanakaiUsageFeeChargeFailedBody(amountJpy),
    },
    participation_payment_expiring: {
      title: 'お支払い確認期限が近づいています',
      body: 'お支払い確認期限が近づいています。カード情報をご確認ください。',
    },
    participation_payment_expired: {
      title: 'お支払いを確認できなかったため、今回の参加枠は解除されました',
      body: '期限までにお支払いを確認できなかったため、参加枠を解除しました。',
    },
  }[input.type];

  await admin.from('hanakai_event_operation_notifications').insert({
    event_id: input.eventId,
    member_id: input.memberId,
    notification_type: input.type,
    channel: 'in_app',
    payload: copy,
  });
}

export async function expireOverdueParticipationPayments(limit = 100) {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false as const, error: 'DB unavailable' };

  const { data, error } = await admin.rpc('hanakai_expire_overdue_participation_payments', { p_limit: limit });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, expiredCount: (data as { expired_count?: number })?.expired_count ?? 0 };
}

export async function getEventCapacityBreakdown(eventId: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;

  const { data: event } = await admin.from('hanakai_events').select('capacity').eq('id', eventId).maybeSingle();
  if (!event) return null;

  const { data: apps } = await admin
    .from('hanakai_event_applications')
    .select('status, payment_deadline_at')
    .eq('event_id', eventId);

  const now = Date.now();
  const confirmed = apps?.filter((a) => a.status === 'confirmed').length ?? 0;
  const processing = apps?.filter((a) => a.status === 'payment_processing').length ?? 0;
  const failedActive =
    apps?.filter(
      (a) =>
        a.status === 'payment_failed' &&
        (!a.payment_deadline_at || new Date(a.payment_deadline_at).getTime() > now),
    ).length ?? 0;
  const reserved = processing + failedActive;
  const capacity = Number(event.capacity);
  const additionalSlots = Math.max(0, capacity - confirmed - reserved);

  return {
    capacity,
    confirmed,
    processing,
    failedActive,
    additionalSlots,
  };
}

export async function getApplicationPaymentContext(applicationId: string, memberId: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;

  const { data: payment } = await admin
    .from('hanakai_participation_payments')
    .select('id, payment_deadline_at, failure_message, member_id')
    .eq('application_id', applicationId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) return null;

  const method = await getDefaultPaymentMethod(memberId);
  return {
    paymentId: payment.id as string,
    deadlineAt: payment.payment_deadline_at as string | null,
    failureMessage: payment.failure_message as string | null,
    brand: method?.brand ?? null,
    last4: method?.last_4 ?? null,
  };
}

export { createParticipationNotification };
