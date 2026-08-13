import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  addDays,
  calculateReferralFee,
  generateInvoiceNumber,
  isWithinCheckinWindow,
} from '@/lib/connection/event-operations/fee-calculator';
import { generateCheckinCode, verifyCheckinCode } from '@/lib/connection/event-operations/checkin-code';
import { getSignedDocumentUrl } from '@/lib/connection/event-operations/document-storage';
import type {
  BillingTarget,
  CreateEventOperationsInput,
  EventCheckin,
  EventInvoice,
  EventOperationsMeta,
  EventRevenueReport,
  InvoicePaymentStatus,
  RevenueReportStatus,
} from '@/lib/connection/event-operations/types';

async function db() {
  return createServerSupabaseClient();
}

async function adminDb() {
  return createAdminSupabaseClient();
}

function mapCheckin(row: Record<string, unknown>): EventCheckin {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    memberId: String(row.member_id),
    applicationId: row.application_id ? String(row.application_id) : null,
    method: row.method as EventCheckin['method'],
    status: row.status as EventCheckin['status'],
    checkedInAt: String(row.checked_in_at),
    checkedInByMemberId: row.checked_in_by_member_id ? String(row.checked_in_by_member_id) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    cancelledByMemberId: row.cancelled_by_member_id ? String(row.cancelled_by_member_id) : null,
  };
}

function mapReport(row: Record<string, unknown>): EventRevenueReport {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    reportedByMemberId: row.reported_by_member_id ? String(row.reported_by_member_id) : null,
    totalParticipants: Number(row.total_participants ?? 0),
    grossSalesTaxIncluded: Number(row.gross_sales_tax_included ?? 0),
    salesTaxRate: Number(row.sales_tax_rate ?? row.tax_rate ?? 0.1),
    billingTaxRate: Number(row.billing_tax_rate ?? row.sales_tax_rate ?? row.tax_rate ?? 0.1),
    notes: row.notes ? String(row.notes) : null,
    status: row.status as RevenueReportStatus,
    adminMemo: row.admin_memo ? String(row.admin_memo) : null,
    revisionReason: row.revision_reason ? String(row.revision_reason) : null,
    submittedAt: String(row.submitted_at),
    approvedAt: row.approved_at ? String(row.approved_at) : null,
  };
}

function mapInvoice(row: Record<string, unknown>): EventInvoice {
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoice_number),
    eventId: String(row.event_id),
    reportId: String(row.report_id),
    billingTarget: row.billing_target as EventInvoice['billingTarget'],
    billingName: String(row.billing_name),
    billingContact: row.billing_contact ? String(row.billing_contact) : null,
    billingPhone: row.billing_phone ? String(row.billing_phone) : null,
    billingEmail: row.billing_email ? String(row.billing_email) : null,
    billingAddress: row.billing_address ? String(row.billing_address) : null,
    hanakaiCheckinCount: Number(row.hanakai_checkin_count ?? 0),
    totalParticipants: Number(row.total_participants ?? 0),
    grossSalesTaxExcluded: Number(row.gross_sales_tax_excluded ?? 0),
    referralRatio: Number(row.referral_ratio ?? 0),
    hanakaiTargetSales: Number(row.hanakai_target_sales ?? 0),
    serviceFeeTaxExcluded: Number(row.service_fee_tax_excluded ?? 0),
    salesTaxRate: Number(row.sales_tax_rate ?? 0.1),
    billingTaxRate: Number(row.billing_tax_rate ?? 0.1),
    taxAmount: Number(row.tax_amount ?? 0),
    totalAmountTaxIncluded: Number(row.total_amount_tax_included ?? 0),
    invoiceDate: String(row.invoice_date),
    dueDate: String(row.due_date),
    paymentStatus: row.payment_status as InvoicePaymentStatus,
    stripeInvoiceId: row.stripe_invoice_id ? String(row.stripe_invoice_id) : null,
    adminMemo: row.admin_memo ? String(row.admin_memo) : null,
  };
}

export function buildEventOperationsPayload(input: CreateEventOperationsInput): {
  payload: Record<string, unknown>;
  checkinCode: string;
} {
  const { code, hash } = input.precomputedCheckin ?? generateCheckinCode();
  return {
    checkinCode: code,
    payload: {
      external_recruitment: input.externalRecruitment,
      venue_permission_confirmed: input.venuePermissionConfirmed,
      venue_fee_explained: input.venueFeeExplained,
      billing_target: input.billingTarget,
      venue_billing_name: input.billingTarget === 'venue' ? input.venueBillingName ?? '' : null,
      venue_billing_contact: input.billingTarget === 'venue' ? input.venueBillingContact ?? '' : null,
      venue_billing_phone: input.billingTarget === 'venue' ? input.venueBillingPhone ?? '' : null,
      venue_billing_email: input.billingTarget === 'venue' ? input.venueBillingEmail ?? '' : null,
      venue_billing_address: input.billingTarget === 'venue' ? input.venueBillingAddress ?? '' : null,
      venue_billing_consent: input.billingTarget === 'venue' ? Boolean(input.venueBillingConsent) : false,
      checkin_code_hash: hash,
      checkin_code: code,
    },
  };
}

export async function getEventOperationsMeta(eventId: string): Promise<EventOperationsMeta | null> {
  // Prefer admin so host manage can read checkin_code reliably.
  const sb = (await adminDb()) ?? (await db());
  if (!sb) return null;
  const { data } = await sb.from('hanakai_events').select('*').eq('id', eventId).maybeSingle();
  if (!data) return null;
  return {
    externalRecruitment: data.external_recruitment ?? 'hanakai_only',
    venuePermissionConfirmed: Boolean(data.venue_permission_confirmed),
    venueFeeExplained: Boolean(data.venue_fee_explained),
    billingTarget: data.billing_target ?? 'host',
    venueBillingName: data.venue_billing_name,
    venueBillingContact: data.venue_billing_contact,
    venueBillingPhone: data.venue_billing_phone,
    venueBillingEmail: data.venue_billing_email,
    venueBillingAddress: data.venue_billing_address,
    venueBillingConsent: Boolean(data.venue_billing_consent),
    hasCheckinCode: Boolean(data.checkin_code_hash),
    checkinCode:
      typeof data.checkin_code === 'string' && /^\d{4}$/.test(data.checkin_code)
        ? data.checkin_code
        : null,
    endedAt: data.ended_at,
    revenueReportRequestedAt: data.revenue_report_requested_at,
    startAt: data.start_at ? String(data.start_at) : null,
  };
}

export async function countActiveCheckins(eventId: string): Promise<number> {
  const sb = await adminDb();
  if (!sb) return 0;
  const { count } = await sb
    .from('hanakai_event_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'checked_in');
  return count ?? 0;
}

export async function listEventCheckins(eventId: string): Promise<EventCheckin[]> {
  const sb = await adminDb();
  if (!sb) return [];
  const { data } = await sb
    .from('hanakai_event_checkins')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });
  return (data ?? []).map((row) => mapCheckin(row as Record<string, unknown>));
}

export async function getMemberCheckin(eventId: string, memberId: string): Promise<EventCheckin | null> {
  const sb = await db();
  if (!sb) return null;
  const { data } = await sb
    .from('hanakai_event_checkins')
    .select('*')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .eq('status', 'checked_in')
    .maybeSingle();
  return data ? mapCheckin(data as Record<string, unknown>) : null;
}

export async function regenerateCheckinCode(eventId: string): Promise<string | null> {
  const sb = await adminDb();
  if (!sb) {
    console.error('HANAKAI_CHECKIN_CODE_REGEN_NO_ADMIN', { eventId });
    return null;
  }
  const { code, hash } = generateCheckinCode();
  // Store both plaintext (host display) and hash (verification). Updating hash
  // invalidates any previously issued code.
  const { error } = await sb
    .from('hanakai_events')
    .update({ checkin_code_hash: hash, checkin_code: code })
    .eq('id', eventId);
  if (!error) return code;

  // Fallback: schema-cache lag or older env without checkin_code column.
  console.warn('HANAKAI_CHECKIN_CODE_REGEN_RETRY_HASH_ONLY', { eventId, message: error.message });
  const { error: hashOnlyError } = await sb
    .from('hanakai_events')
    .update({ checkin_code_hash: hash })
    .eq('id', eventId);
  if (hashOnlyError) {
    console.error('HANAKAI_CHECKIN_CODE_REGEN_FAILED', { eventId, message: hashOnlyError.message });
    return null;
  }
  return code;
}

async function countRecentCheckinAttempts(eventId: string, memberId: string): Promise<number> {
  const sb = await adminDb();
  if (!sb) return 0;
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await sb
    .from('hanakai_event_checkin_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .gte('attempted_at', since);
  return count ?? 0;
}

async function logCheckinAttempt(eventId: string, memberId: string, success: boolean) {
  const sb = await adminDb();
  if (!sb) return;
  await sb.from('hanakai_event_checkin_attempts').insert({
    event_id: eventId,
    member_id: memberId,
    success,
  });
}

export async function checkinWithCode(
  eventId: string,
  memberId: string,
  code: string,
): Promise<'ok' | 'invalid_code' | 'already' | 'outside_window' | 'rate_limited' | 'error'> {
  const sb = await db();
  if (!sb) return 'error';

  const attempts = await countRecentCheckinAttempts(eventId, memberId);
  if (attempts >= 10) return 'rate_limited';

  const existing = await getMemberCheckin(eventId, memberId);
  if (existing) return 'already';

  const { data: event } = await sb
    .from('hanakai_events')
    .select('checkin_code_hash, start_at, ended_at')
    .eq('id', eventId)
    .maybeSingle();

  if (!event?.start_at || !isWithinCheckinWindow(String(event.start_at))) {
    await logCheckinAttempt(eventId, memberId, false);
    return 'outside_window';
  }

  if (!verifyCheckinCode(code, event.checkin_code_hash ? String(event.checkin_code_hash) : null)) {
    await logCheckinAttempt(eventId, memberId, false);
    return 'invalid_code';
  }

  const { data: app } = await sb
    .from('hanakai_event_applications')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  const { error } = await sb.from('hanakai_event_checkins').insert({
    event_id: eventId,
    member_id: memberId,
    application_id: app?.id ?? null,
    method: 'code',
    status: 'checked_in',
  });
  if (error) {
    console.error('HANAKAI_CHECKIN_INSERT_FAILED', error.message);
    await logCheckinAttempt(eventId, memberId, false);
    return 'error';
  }
  await logCheckinAttempt(eventId, memberId, true);
  return 'ok';
}

export async function manualCheckin(eventId: string, targetMemberId: string, hostMemberId: string): Promise<boolean> {
  const sb = await adminDb();
  if (!sb) return false;
  const existing = await getMemberCheckin(eventId, targetMemberId);
  if (existing) return true;
  const { data: app } = await sb
    .from('hanakai_event_applications')
    .select('id')
    .eq('event_id', eventId)
    .eq('member_id', targetMemberId)
    .maybeSingle();
  const { error } = await sb.from('hanakai_event_checkins').insert({
    event_id: eventId,
    member_id: targetMemberId,
    application_id: app?.id ?? null,
    method: 'manual',
    status: 'checked_in',
    checked_in_by_member_id: hostMemberId,
  });
  return !error;
}

export async function cancelCheckin(eventId: string, targetMemberId: string, hostMemberId: string): Promise<boolean> {
  const sb = await adminDb();
  if (!sb) return false;
  const { error } = await sb
    .from('hanakai_event_checkins')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by_member_id: hostMemberId,
    })
    .eq('event_id', eventId)
    .eq('member_id', targetMemberId)
    .eq('status', 'checked_in');
  return !error;
}

export async function markEventEnded(eventId: string): Promise<void> {
  const sb = await adminDb();
  if (!sb) return;
  await sb
    .from('hanakai_events')
    .update({
      ended_at: new Date().toISOString(),
      status: 'completed',
      revenue_report_requested_at: new Date().toISOString(),
    })
    .eq('id', eventId);
}

export async function submitRevenueReport(input: {
  eventId: string;
  reportedByMemberId: string;
  totalParticipants: number;
  grossSalesTaxIncluded: number;
  salesTaxRate: number;
  billingTaxRate: number;
  notes?: string;
  documents: Array<{ storagePath: string; fileName?: string; mimeType?: string; documentType: string }>;
}): Promise<EventRevenueReport | null> {
  const sb = await adminDb();
  if (!sb) return null;

  if (input.documents.length === 0) {
    console.error('HANAKAI_REVENUE_REPORT_NO_DOCUMENTS');
    return null;
  }

  const hanakaiCount = await countActiveCheckins(input.eventId);
  if (hanakaiCount > input.totalParticipants) {
    console.error('HANAKAI_REVENUE_REPORT_INVALID_PARTICIPANTS', { hanakaiCount, total: input.totalParticipants });
    return null;
  }

  let breakdown;
  try {
    breakdown = calculateReferralFee({
      totalParticipants: input.totalParticipants,
      hanakaiCheckinCount: hanakaiCount,
      grossSalesTaxIncluded: input.grossSalesTaxIncluded,
      salesTaxRate: input.salesTaxRate,
      billingTaxRate: input.billingTaxRate,
    });
  } catch {
    return null;
  }

  const { data: report, error } = await sb
    .from('hanakai_event_revenue_reports')
    .insert({
      event_id: input.eventId,
      reported_by_member_id: input.reportedByMemberId,
      total_participants: breakdown.totalParticipants,
      gross_sales_tax_included: breakdown.grossSalesTaxIncluded,
      sales_tax_rate: breakdown.salesTaxRate,
      billing_tax_rate: breakdown.billingTaxRate,
      notes: input.notes ?? null,
      status: 'submitted',
    })
    .select('*')
    .single();

  if (error || !report) {
    console.error('HANAKAI_REVENUE_REPORT_INSERT_FAILED', error?.message);
    return null;
  }

  await sb.from('hanakai_event_revenue_documents').insert(
    input.documents.map((doc) => ({
      report_id: report.id,
      storage_path: doc.storagePath,
      document_type: doc.documentType,
      file_name: doc.fileName ?? null,
      mime_type: doc.mimeType ?? null,
    })),
  );

  return { ...mapReport(report as Record<string, unknown>), breakdown };
}

async function createInvoiceForReport(reportId: string): Promise<EventInvoice | null> {
  const sb = await adminDb();
  if (!sb) return null;

  const existing = await getInvoiceByReportId(reportId);
  if (existing) return existing;

  const report = await getRevenueReport(reportId);
  if (!report?.breakdown) return null;

  const { data: event } = await sb.from('hanakai_events').select('*').eq('id', report.eventId).maybeSingle();
  const billingTarget = (event?.billing_target ?? 'host') as BillingTarget;
  const billingName =
    billingTarget === 'venue'
      ? String(event?.venue_billing_name ?? '店舗・会場')
      : String(event?.host_name ?? '主催者');

  const invoiceDate = new Date();
  const breakdown = report.breakdown;
  const { data: row, error } = await sb
    .from('hanakai_event_invoices')
    .insert({
      invoice_number: generateInvoiceNumber(invoiceDate),
      event_id: report.eventId,
      report_id: reportId,
      billing_target: billingTarget,
      billing_name: billingName,
      billing_contact: billingTarget === 'venue' ? event?.venue_billing_contact : null,
      billing_phone: billingTarget === 'venue' ? event?.venue_billing_phone : null,
      billing_email: billingTarget === 'venue' ? event?.venue_billing_email : null,
      billing_address: billingTarget === 'venue' ? event?.venue_billing_address : null,
      hanakai_checkin_count: breakdown.hanakaiCheckinCount,
      total_participants: breakdown.totalParticipants,
      gross_sales_tax_excluded: breakdown.grossSalesTaxExcluded,
      referral_ratio: breakdown.referralRatio,
      hanakai_target_sales: breakdown.hanakaiTargetSales,
      service_fee_tax_excluded: breakdown.serviceFeeTaxExcluded,
      sales_tax_rate: breakdown.salesTaxRate,
      billing_tax_rate: breakdown.billingTaxRate,
      tax_amount: breakdown.taxAmount,
      total_amount_tax_included: breakdown.totalAmountTaxIncluded,
      invoice_date: invoiceDate.toISOString().slice(0, 10),
      due_date: addDays(invoiceDate, 30),
      payment_status: 'pending',
    })
    .select('*')
    .single();

  if (error || !row) return null;
  return mapInvoice(row as Record<string, unknown>);
}

export async function listRevenueReports(): Promise<EventRevenueReport[]> {
  const sb = await adminDb();
  if (!sb) return [];
  const { data } = await sb
    .from('hanakai_event_revenue_reports')
    .select('*')
    .order('submitted_at', { ascending: false });
  return (data ?? []).map((row) => mapReport(row as Record<string, unknown>));
}

export async function getRevenueReport(reportId: string): Promise<EventRevenueReport | null> {
  const sb = await adminDb();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_event_revenue_reports').select('*').eq('id', reportId).maybeSingle();
  if (!data) return null;
  const report = mapReport(data as Record<string, unknown>);
  const hanakaiCount = await countActiveCheckins(report.eventId);
  report.breakdown = calculateReferralFee({
    totalParticipants: report.totalParticipants,
    hanakaiCheckinCount: hanakaiCount,
    grossSalesTaxIncluded: report.grossSalesTaxIncluded,
    salesTaxRate: report.salesTaxRate,
    billingTaxRate: report.billingTaxRate,
  });
  const { data: docs } = await sb.from('hanakai_event_revenue_documents').select('*').eq('report_id', reportId);
  report.documents = await Promise.all(
    (docs ?? []).map(async (doc) => ({
      id: String(doc.id),
      reportId: String(doc.report_id),
      storagePath: String(doc.storage_path),
      documentUrl: doc.storage_path ? await getSignedDocumentUrl(String(doc.storage_path)) : null,
      documentType: String(doc.document_type),
      fileName: doc.file_name ? String(doc.file_name) : null,
      mimeType: doc.mime_type ? String(doc.mime_type) : null,
    })),
  );
  return report;
}

export async function listInvoices(): Promise<EventInvoice[]> {
  const sb = await adminDb();
  if (!sb) return [];
  const { data } = await sb.from('hanakai_event_invoices').select('*').order('invoice_date', { ascending: false });
  return (data ?? []).map((row) => mapInvoice(row as Record<string, unknown>));
}

export async function getInvoice(invoiceId: string): Promise<EventInvoice | null> {
  const sb = await adminDb();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_event_invoices').select('*').eq('id', invoiceId).maybeSingle();
  return data ? mapInvoice(data as Record<string, unknown>) : null;
}

export async function updateRevenueReportStatus(
  reportId: string,
  status: RevenueReportStatus,
  adminMemberId: string,
  options?: { adminMemo?: string; revisionReason?: string },
): Promise<boolean> {
  const sb = await adminDb();
  if (!sb) return false;
  const patch: Record<string, unknown> = {
    status,
    admin_memo: options?.adminMemo ?? null,
    revision_reason: options?.revisionReason ?? null,
    updated_at: new Date().toISOString(),
  };
  if (status === 'approved') {
    patch.approved_at = new Date().toISOString();
    patch.approved_by_member_id = adminMemberId;
  }
  const { error } = await sb.from('hanakai_event_revenue_reports').update(patch).eq('id', reportId);
  if (error) return false;

  if (status === 'approved') {
    await createInvoiceForReport(reportId);
    const { data: r } = await sb.from('hanakai_event_revenue_reports').select('event_id, reported_by_member_id').eq('id', reportId).maybeSingle();
    if (r?.reported_by_member_id) {
      await logOperationNotification({
        eventId: String(r.event_id),
        memberId: String(r.reported_by_member_id),
        notificationType: 'revenue_report_approved',
        payload: { reportId },
      });
    }
  }
  if (status === 'revision_requested' && options?.revisionReason) {
    const { data: r } = await sb.from('hanakai_event_revenue_reports').select('event_id, reported_by_member_id').eq('id', reportId).maybeSingle();
    if (r?.reported_by_member_id) {
      await logOperationNotification({
        eventId: String(r.event_id),
        memberId: String(r.reported_by_member_id),
        notificationType: 'revenue_report_revision_requested',
        payload: { reason: options.revisionReason },
      });
    }
  }
  return true;
}

export async function updateInvoicePaymentStatus(
  invoiceId: string,
  paymentStatus: InvoicePaymentStatus,
  adminMemo?: string,
): Promise<boolean> {
  const sb = await adminDb();
  if (!sb) return false;
  const { error } = await sb
    .from('hanakai_event_invoices')
    .update({ payment_status: paymentStatus, admin_memo: adminMemo ?? null, updated_at: new Date().toISOString() })
    .eq('id', invoiceId);
  return !error;
}

export async function getRevenueReportByEventId(eventId: string): Promise<EventRevenueReport | null> {
  const sb = await adminDb();
  if (!sb) return null;
  const { data } = await sb
    .from('hanakai_event_revenue_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return getRevenueReport(String(data.id));
}

export async function getInvoiceByReportId(reportId: string): Promise<EventInvoice | null> {
  const sb = await adminDb();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_event_invoices').select('*').eq('report_id', reportId).maybeSingle();
  return data ? mapInvoice(data as Record<string, unknown>) : null;
}

export async function processRevenueReportReminders(): Promise<number> {
  const sb = await adminDb();
  if (!sb) return 0;
  const now = Date.now();
  const { data: events } = await sb
    .from('hanakai_events')
    .select('id, host_member_id, revenue_report_requested_at, revenue_report_reminder_12h_at, revenue_report_reminder_24h_at')
    .not('revenue_report_requested_at', 'is', null)
    .not('ended_at', 'is', null);

  let sent = 0;
  for (const event of events ?? []) {
    const requestedAt = event.revenue_report_requested_at ? new Date(String(event.revenue_report_requested_at)).getTime() : 0;
    if (!requestedAt) continue;
    const hours = (now - requestedAt) / (1000 * 60 * 60);

    const { count } = await sb
      .from('hanakai_event_revenue_reports')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id);
    if ((count ?? 0) > 0) continue;

    if (hours >= 12 && !event.revenue_report_reminder_12h_at) {
      await logOperationNotification({
        eventId: String(event.id),
        memberId: event.host_member_id ? String(event.host_member_id) : null,
        notificationType: 'revenue_report_reminder_12h',
        payload: { message: '売上報告の提出をお願いします（12時間経過）' },
      });
      await sb.from('hanakai_events').update({ revenue_report_reminder_12h_at: new Date().toISOString() }).eq('id', event.id);
      sent += 1;
    } else if (hours >= 24 && !event.revenue_report_reminder_24h_at) {
      await logOperationNotification({
        eventId: String(event.id),
        memberId: event.host_member_id ? String(event.host_member_id) : null,
        notificationType: 'revenue_report_reminder_24h',
        payload: { message: '売上報告の提出をお願いします（24時間経過）' },
      });
      await sb.from('hanakai_events').update({ revenue_report_reminder_24h_at: new Date().toISOString() }).eq('id', event.id);
      sent += 1;
    }
  }
  return sent;
}

export async function logOperationNotification(input: {
  eventId: string;
  memberId?: string | null;
  notificationType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const sb = await adminDb();
  if (!sb) return;
  await sb.from('hanakai_event_operation_notifications').insert({
    event_id: input.eventId,
    member_id: input.memberId ?? null,
    notification_type: input.notificationType,
    payload: input.payload ?? {},
  });
  console.log('HANAKAI_EVENT_OPERATION_NOTIFICATION', input);
}
