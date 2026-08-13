'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadRevenueDocument } from '@/lib/connection/event-operations/document-storage';
import {
  cancelCheckin,
  checkinWithCode,
  logOperationNotification,
  manualCheckin,
  markEventEnded,
  regenerateCheckinCode,
  submitRevenueReport,
  updateInvoicePaymentStatus,
  updateRevenueReportStatus,
} from '@/lib/connection/event-operations/repo';
import { ensureViewerMemberId } from '@/lib/connection/identity';
import { requireHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import { requireEventHostAccess } from '@/lib/connection/group-access';
import type { InvoicePaymentStatus, RevenueReportStatus } from '@/lib/connection/event-operations/types';

export async function participantCheckinAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const code = String(formData.get('code') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId || !eventId || code.length !== 4) {
    redirect(`/events/${eventId}/checkin?error=invalid`);
  }

  const result = await checkinWithCode(eventId, memberId, code);
  if (result === 'rate_limited') redirect(`/events/${eventId}/checkin?error=rate`);
  if (result === 'outside_window') redirect(`/events/${eventId}/checkin?error=window`);
  if (result === 'invalid_code') redirect(`/events/${eventId}/checkin?error=code`);
  if (result === 'already') redirect(`/events/${eventId}/checkin?done=1`);
  if (result !== 'ok') redirect(`/events/${eventId}/checkin?error=failed`);

  await logOperationNotification({
    eventId,
    memberId,
    notificationType: 'checkin_completed',
    payload: {},
  });
  redirect(`/events/${eventId}/checkin?done=1`);
}

export async function hostManualCheckinAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const targetMemberId = String(formData.get('memberId') ?? '');
  const { viewerMemberId: hostMemberId } = await requireEventHostAccess(eventId);
  await manualCheckin(eventId, targetMemberId, hostMemberId);
  await logOperationNotification({
    eventId,
    memberId: targetMemberId,
    notificationType: 'checkin_completed',
    payload: { method: 'manual' },
  });
  revalidatePath(`/events/manage/${eventId}`);
  redirect(`/events/manage/${eventId}?checkin=1`);
}

export async function hostCancelCheckinAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const targetMemberId = String(formData.get('memberId') ?? '');
  const { viewerMemberId: hostMemberId } = await requireEventHostAccess(eventId);
  await cancelCheckin(eventId, targetMemberId, hostMemberId);
  revalidatePath(`/events/manage/${eventId}`);
  redirect(`/events/manage/${eventId}?checkin_cancelled=1`);
}

export async function regenerateCheckinCodeAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventId) redirect('/events');
  await requireEventHostAccess(eventId);
  const code = await regenerateCheckinCode(eventId);
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  if (!code) redirect(`/events/manage/${eventId}?regen_error=1`);
  redirect(`/events/manage/${eventId}?checkin_regen=1&new_checkin_code=${encodeURIComponent(code)}`);
}

export async function endEventAndRequestRevenueAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const { viewerMemberId: hostId } = await requireEventHostAccess(eventId);
  await markEventEnded(eventId);
  await logOperationNotification({
    eventId,
    memberId: hostId,
    notificationType: 'revenue_report_requested',
    payload: { message: 'イベントの売上をご報告ください' },
  });
  revalidatePath(`/events/manage/${eventId}`);
  redirect(`/events/${eventId}/revenue-report?requested=1`);
}

export async function submitRevenueReportAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const { viewerMemberId: memberId } = await requireEventHostAccess(eventId);
  const totalParticipants = Number(formData.get('totalParticipants') ?? 0);
  const grossSalesTaxIncluded = Number(formData.get('grossSalesTaxIncluded') ?? 0);
  const salesTaxRate = Number(formData.get('salesTaxRate') ?? 0.1);
  const billingTaxRate = Number(formData.get('billingTaxRate') ?? salesTaxRate);
  const notes = String(formData.get('notes') ?? '').trim();

  if (totalParticipants <= 0 || grossSalesTaxIncluded < 0) {
    redirect(`/events/${eventId}/revenue-report?error=validation`);
  }

  const documents: Array<{ storagePath: string; fileName?: string; mimeType?: string; documentType: string }> = [];
  const files = formData.getAll('documents');
  for (const entry of files) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const uploaded = await uploadRevenueDocument(eventId, entry);
    if (uploaded?.storagePath) {
      documents.push({
        storagePath: uploaded.storagePath,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        documentType: entry.type === 'application/pdf' ? 'pdf' : 'image',
      });
    }
  }

  if (documents.length === 0) {
    redirect(`/events/${eventId}/revenue-report?error=documents`);
  }

  const report = await submitRevenueReport({
    eventId,
    reportedByMemberId: memberId,
    totalParticipants,
    grossSalesTaxIncluded,
    salesTaxRate,
    billingTaxRate,
    notes,
    documents,
  });
  if (!report) redirect(`/events/${eventId}/revenue-report?error=failed`);

  revalidatePath('/admin/hanakai/revenue-reports');
  revalidatePath('/admin/hanakai/invoices');
  redirect(`/events/${eventId}/revenue-report?submitted=1`);
}

export async function adminUpdateRevenueReportAction(formData: FormData) {
  const adminId = await requireHanakaiAdminAccess('/admin/hanakai/revenue-reports');
  const reportId = String(formData.get('reportId') ?? '');
  const status = String(formData.get('status') ?? 'submitted') as RevenueReportStatus;
  const adminMemo = String(formData.get('adminMemo') ?? '').trim();
  const revisionReason = String(formData.get('revisionReason') ?? '').trim();
  await updateRevenueReportStatus(reportId, status, adminId, { adminMemo, revisionReason });
  revalidatePath('/admin/hanakai/revenue-reports');
  revalidatePath('/admin/hanakai/invoices');
  redirect('/admin/hanakai/revenue-reports?updated=1');
}

export async function adminUpdateInvoicePaymentAction(formData: FormData) {
  await requireHanakaiAdminAccess('/admin/hanakai/invoices');
  const invoiceId = String(formData.get('invoiceId') ?? '');
  const paymentStatus = String(formData.get('paymentStatus') ?? 'pending') as InvoicePaymentStatus;
  const adminMemo = String(formData.get('adminMemo') ?? '').trim();
  await updateInvoicePaymentStatus(invoiceId, paymentStatus, adminMemo);
  revalidatePath('/admin/hanakai/invoices');
  redirect('/admin/hanakai/invoices?updated=1');
}
