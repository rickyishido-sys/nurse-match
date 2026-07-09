'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import {
  adminApproveApplication,
  adminRejectApplication,
  adminSaveReportNote,
  adminUpdateReportStatus,
} from '@/lib/connection/hanakai-admin-repo';
import { adminResolveInquiry } from '@/lib/connection/contact-inquiry';
import { updateEventRecruitmentType } from '@/lib/connection/participation-confirmation';

async function requireAdminAction(): Promise<string> {
  const access = await getHanakaiAdminAccess();
  if (!access.allowed || !access.memberId) {
    redirect('/admin/hanakai?error=forbidden');
  }
  return access.memberId;
}

export async function adminApproveApplicationAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const applicationId = String(formData.get('applicationId') ?? '').trim();
  if (!applicationId) {
    redirect('/admin/hanakai/applications?error=missing_id');
  }

  const result = await adminApproveApplication(applicationId, adminMemberId);
  if (!result.ok) {
    redirect(`/admin/hanakai/applications?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/applications');
  revalidatePath('/admin/hanakai');
  revalidatePath(`/events/${result.eventId}`);
  revalidatePath(`/events/manage/${result.eventId}`);
  redirect('/admin/hanakai/applications?success=approved');
}

export async function adminUpdateEventRecruitmentAction(formData: FormData) {
  await requireAdminAction();
  const eventId = String(formData.get('eventId') ?? '').trim();
  const recruitmentType = String(formData.get('recruitmentType') ?? 'standard').trim();
  if (!eventId) redirect('/admin/hanakai/events?error=missing_id');
  if (recruitmentType !== 'standard' && recruitmentType !== 'additional') {
    redirect('/admin/hanakai/events?error=invalid_type');
  }

  const result = await updateEventRecruitmentType(eventId, recruitmentType);
  if (!result.ok) {
    redirect(`/admin/hanakai/events?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/events');
  revalidatePath('/events');
  redirect('/admin/hanakai/events?success=recruitment_updated');
}

export async function adminRejectApplicationAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const applicationId = String(formData.get('applicationId') ?? '').trim();
  const decisionNote = String(formData.get('decisionNote') ?? '').trim();
  if (!applicationId) {
    redirect('/admin/hanakai/applications?error=missing_id');
  }
  if (!decisionNote) {
    redirect(`/admin/hanakai/applications?error=note_required&applicationId=${applicationId}`);
  }

  const result = await adminRejectApplication(applicationId, adminMemberId, decisionNote);
  if (!result.ok) {
    redirect(`/admin/hanakai/applications?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/applications');
  revalidatePath('/admin/hanakai');
  redirect('/admin/hanakai/applications?success=rejected');
}

export async function adminUpdateReportStatusAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const reportId = String(formData.get('reportId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as 'reviewing' | 'resolved' | 'dismissed';
  const note = String(formData.get('note') ?? '').trim();

  if (!reportId) redirect('/admin/hanakai/reports?error=missing_id');
  if (status !== 'reviewing' && status !== 'resolved' && status !== 'dismissed') {
    redirect('/admin/hanakai/reports?error=invalid_status');
  }
  if (status === 'dismissed' && !note) {
    redirect(`/admin/hanakai/reports?error=note_required&reportId=${reportId}`);
  }

  const result = await adminUpdateReportStatus(reportId, status, adminMemberId, note || null);
  if (!result.ok) {
    redirect(`/admin/hanakai/reports?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/reports');
  revalidatePath('/admin/hanakai');
  redirect(`/admin/hanakai/reports?success=${status}`);
}

export async function adminSaveReportNoteAction(formData: FormData) {
  await requireAdminAction();
  const reportId = String(formData.get('reportId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  if (!reportId) redirect('/admin/hanakai/reports?error=missing_id');

  const result = await adminSaveReportNote(reportId, note);
  if (!result.ok) {
    redirect(`/admin/hanakai/reports?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/reports');
  redirect('/admin/hanakai/reports?success=note_saved');
}

export async function adminResolveInquiryAction(formData: FormData) {
  await requireAdminAction();
  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  if (!inquiryId) redirect('/admin/hanakai/inquiries?error=missing_id');

  const result = await adminResolveInquiry(inquiryId);
  if (!result.ok) {
    redirect(`/admin/hanakai/inquiries?error=${encodeURIComponent(result.error ?? 'resolve_failed')}`);
  }

  revalidatePath('/admin/hanakai/inquiries');
  revalidatePath('/admin/hanakai');
  redirect('/admin/hanakai/inquiries?success=inquiry_resolved');
}
