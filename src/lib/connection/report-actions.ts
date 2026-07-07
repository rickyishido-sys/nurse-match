'use server';

import {
  REPORT_CATEGORIES,
  type ReportCategory,
  type ReportTargetType,
} from '@/lib/connection/report-constants';
import { submitHanakaiReport } from '@/lib/connection/report';
import { getViewerMemberId } from '@/lib/connection/identity';

const VALID_CATEGORIES = new Set(REPORT_CATEGORIES.map((c) => c.value));
const VALID_TARGET_TYPES = new Set<ReportTargetType>([
  'member',
  'event',
  'profile',
  'message_future',
  'other',
]);

export type SubmitReportResult =
  | { ok: true }
  | { ok: false; error: 'login_required' | 'invalid_target' | 'invalid_category' | 'missing_target' | 'self_report' | 'submit_failed' };

export async function submitReportAction(formData: FormData): Promise<SubmitReportResult> {
  const reporterMemberId = await getViewerMemberId();
  if (!reporterMemberId) {
    return { ok: false, error: 'login_required' };
  }

  const targetType = String(formData.get('targetType') ?? '').trim() as ReportTargetType;
  const targetMemberId = String(formData.get('targetMemberId') ?? '').trim() || null;
  const targetEventId = String(formData.get('targetEventId') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() as ReportCategory;
  const description = String(formData.get('description') ?? '').trim();

  if (!VALID_TARGET_TYPES.has(targetType)) {
    return { ok: false, error: 'invalid_target' };
  }
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, error: 'invalid_category' };
  }

  if (targetType === 'event') {
    if (!targetEventId) return { ok: false, error: 'missing_target' };
  } else if (targetType === 'member' || targetType === 'profile') {
    if (!targetMemberId) return { ok: false, error: 'missing_target' };
    if (targetMemberId === reporterMemberId) {
      return { ok: false, error: 'self_report' };
    }
  }

  try {
    await submitHanakaiReport({
      reporterMemberId,
      targetType,
      targetMemberId,
      targetEventId,
      category,
      description: description || null,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'submit_failed' };
  }
}
