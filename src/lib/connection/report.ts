import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  REPORT_CATEGORIES,
  type ReportCategory,
  type ReportTargetType,
} from '@/lib/connection/report-constants';

const VALID_CATEGORIES = new Set(REPORT_CATEGORIES.map((c) => c.value));

export type SubmitReportInput = {
  reporterMemberId: string;
  targetType: ReportTargetType;
  targetMemberId?: string | null;
  targetEventId?: string | null;
  category: ReportCategory;
  description?: string | null;
};

export async function submitHanakaiReport(input: SubmitReportInput): Promise<void> {
  if (!VALID_CATEGORIES.has(input.category)) {
    throw new Error('無効な通報カテゴリです');
  }

  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const targetId =
    input.targetMemberId ?? input.targetEventId ?? 'unknown';

  const { error } = await sb.from('hanakai_reports').insert({
    reporter_member_id: input.reporterMemberId,
    target_type: input.targetType,
    target_id: targetId,
    target_member_id: input.targetMemberId ?? null,
    target_event_id: input.targetEventId ?? null,
    category: input.category,
    description: input.description?.trim() || null,
    reason: input.category,
    detail: input.description?.trim() || '',
    status: 'new',
  });

  if (error) {
    console.error('HANAKAI_REPORT_INSERT_FAILED', {
      reporterMemberId: input.reporterMemberId,
      targetType: input.targetType,
      message: error.message,
      code: error.code,
    });
    throw new Error('通報の送信に失敗しました');
  }
}
