import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createEvent } from '@/lib/connection/repo';
import { ensureHanakaiMemberForAuthUser } from '@/lib/connection/identity';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ConnectionEventCategory, EventApprovalMode } from '@/lib/connection/types';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: ConnectionEventCategory[] = [
  'flower',
  'coffee',
  'business',
  'walking',
  'fitness',
  'learning',
  'bar',
  'sports',
  'workshop',
  'other',
];

type CreateEventBody = {
  title?: string;
  category?: string;
  description?: string;
  startAt?: string;
  area?: string;
  venue?: string;
  capacity?: number;
  fee?: number;
  conditions?: string;
  approvalMode?: string;
  imageUrls?: string[];
};

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ ok: false, error: message, code: code ?? null }, { status });
}

function logApiEventCreateError(error: unknown) {
  const supa: SupabaseErrorLike =
    typeof error === 'object' && error !== null
      ? (error as SupabaseErrorLike)
      : { message: String(error) };

  console.error('HANAKAI_API_EVENT_CREATE_ERROR', {
    message: error instanceof Error ? error.message : supa.message ?? String(error),
    stack: error instanceof Error ? error.stack ?? null : null,
    supabase: {
      code: supa.code ?? null,
      message: supa.message ?? null,
      details: supa.details ?? null,
      hint: supa.hint ?? null,
    },
  });
}

export async function POST(request: Request) {
  console.log('HANAKAI_API_EVENT_CREATE_1_START');
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      logApiEventCreateError({ message: 'supabase_client_null', code: 'CONFIG' });
      return jsonError('データベース接続の設定が見つかりませんでした。', 500, 'CONFIG');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log('HANAKAI_API_EVENT_CREATE_2_SESSION_FAIL');
      return jsonError('ログインが必要です。', 401, 'UNAUTHORIZED');
    }
    console.log('HANAKAI_API_EVENT_CREATE_2_SESSION_OK', {
      userId: user.id,
      email: user.email ?? null,
    });

    const memberId = await ensureHanakaiMemberForAuthUser(user.id, {
      email: user.email,
      nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    });
    if (!memberId) {
      console.log('HANAKAI_API_EVENT_CREATE_3_MEMBER_FAIL', { userId: user.id });
      return jsonError('会員プロフィールの準備ができていません。登録を完了してから再度お試しください。', 403, 'NO_MEMBER');
    }
    console.log('HANAKAI_API_EVENT_CREATE_3_MEMBER_OK', { memberId });

    let body: CreateEventBody;
    try {
      body = (await request.json()) as CreateEventBody;
    } catch (parseError) {
      logApiEventCreateError(parseError);
      return jsonError('送信データの形式が正しくありません。', 400, 'INVALID_JSON');
    }

    const title = String(body.title ?? '').trim();
    const rawCategory = String(body.category ?? 'other');
    const category = (VALID_CATEGORIES.includes(rawCategory as ConnectionEventCategory)
      ? rawCategory
      : 'other') as ConnectionEventCategory;
    const description = String(body.description ?? '').trim();
    const startAt = String(body.startAt ?? '').trim();
    const area = String(body.area ?? '').trim();
    const venue = String(body.venue ?? '').trim();
    const capacity = Math.max(2, Math.min(50, Number(body.capacity) || 6));
    const fee = Math.max(0, Number(body.fee) || 0);
    const conditions = String(body.conditions ?? '').trim();
    const approvalMode = (body.approvalMode === 'auto' ? 'auto' : 'host_approval') as EventApprovalMode;
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.filter((u): u is string => typeof u === 'string' && u.length > 0).slice(0, 5)
      : [];

    if (!title || !startAt || !area) {
      console.error('HANAKAI_API_EVENT_CREATE_4_VALIDATE_FAIL', {
        hasTitle: Boolean(title),
        hasStartAt: Boolean(startAt),
        hasArea: Boolean(area),
      });
      return jsonError('イベント名・開催日時・エリアは必須です。', 400, 'VALIDATION');
    }
    console.log('HANAKAI_API_EVENT_CREATE_4_VALIDATE_OK', {
      titleLength: title.length,
      category,
      startAt,
      areaLength: area.length,
      imageUrlCount: imageUrls.length,
      approvalMode,
    });

    console.log('HANAKAI_API_EVENT_CREATE_5_DB_INSERT_START', { memberId, category });
    const event = await createEvent({
      title,
      category,
      description,
      startAt,
      area,
      venue,
      capacity,
      fee,
      coverUrl: '',
      conditions,
      approvalMode,
      hostId: memberId,
      imageUrls,
    });
    console.log('HANAKAI_API_EVENT_CREATE_6_DB_INSERT_DONE', { eventId: event.id });

    if (event.id.startsWith('ue_')) {
      logApiEventCreateError({ message: 'insert_fallback_id', code: 'DB_INSERT', details: event.id });
      return jsonError('イベントの保存に失敗しました。時間をおいて再度お試しください。', 500, 'DB_INSERT');
    }

    revalidatePath('/events');
    revalidatePath('/home');
    revalidatePath('/admin/hanakai/events');

    console.log('HANAKAI_API_EVENT_CREATE_7_SUCCESS', { eventId: event.id });
    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (error) {
    logApiEventCreateError(error);
    if (typeof error === 'object' && error !== null && ('code' in error || 'message' in error)) {
      const supa = error as SupabaseErrorLike;
      return jsonError(supa.message ?? 'イベントの保存に失敗しました。', 500, supa.code ?? 'DB_ERROR');
    }
    return jsonError('イベントの公開中に問題が発生しました。', 500, 'UNKNOWN');
  }
}
