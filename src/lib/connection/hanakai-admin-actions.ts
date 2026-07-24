'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import {
  adminApproveApplication,
  adminRejectApplication,
  adminSaveReportNote,
  adminUpdateReportStatus,
  adminApproveIdentityReview,
  adminRequestIdentityResubmit,
  adminRejectIdentityReview,
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
  /** @deprecated 一括決定フローへ移行 */
  const applicationId = String(formData.get('applicationId') ?? '').trim();
  redirect(
    `/admin/hanakai/applications?error=${encodeURIComponent('個別の参加決定は利用できません。イベントを選択して一括決定してください。')}${applicationId ? `&applicationId=${applicationId}` : ''}`,
  );
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
  /** @deprecated 一括決定フローへ移行 */
  redirect(
    `/admin/hanakai/applications?error=${encodeURIComponent('個別の選定外操作は利用できません。イベントを選択して一括決定してください。')}`,
  );
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

export async function adminApproveIdentityAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const memberId = String(formData.get('memberId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim() || null;
  if (!memberId) redirect('/admin/hanakai/identity-reviews?error=missing_id');

  const result = await adminApproveIdentityReview(memberId, adminMemberId, note);
  if (!result.ok) {
    redirect(`/admin/hanakai/identity-reviews?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/identity-reviews');
  revalidatePath(`/admin/hanakai/members/${memberId}`);
  revalidatePath(`/profile/${memberId}`);
  revalidatePath('/my-profile');
  redirect('/admin/hanakai/identity-reviews?success=identity_approved');
}

export async function adminRequestIdentityResubmitAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const memberId = String(formData.get('memberId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  if (!memberId) redirect('/admin/hanakai/identity-reviews?error=missing_id');
  if (!note) redirect(`/admin/hanakai/identity-reviews?error=note_required&memberId=${memberId}`);

  const result = await adminRequestIdentityResubmit(memberId, adminMemberId, note);
  if (!result.ok) {
    redirect(`/admin/hanakai/identity-reviews?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/identity-reviews');
  revalidatePath(`/admin/hanakai/members/${memberId}`);
  revalidatePath('/my-profile');
  redirect('/admin/hanakai/identity-reviews?success=resubmit_requested');
}

export async function adminRejectIdentityAction(formData: FormData) {
  const adminMemberId = await requireAdminAction();
  const memberId = String(formData.get('memberId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  if (!memberId) redirect('/admin/hanakai/identity-reviews?error=missing_id');
  if (!note) redirect(`/admin/hanakai/identity-reviews?error=note_required&memberId=${memberId}`);

  const result = await adminRejectIdentityReview(memberId, adminMemberId, note);
  if (!result.ok) {
    redirect(`/admin/hanakai/identity-reviews?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath('/admin/hanakai/identity-reviews');
  revalidatePath(`/admin/hanakai/members/${memberId}`);
  redirect('/admin/hanakai/identity-reviews?success=identity_rejected');
}
