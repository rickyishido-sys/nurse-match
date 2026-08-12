import { NextResponse } from 'next/server';
import { updateApplicationPaymentMethod } from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';

/** Change payment method on a pending application (before charge). */
export async function POST(request: Request) {
  try {
    const memberId = await getViewerMemberId();
    if (!memberId) {
      return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const body = (await request.json()) as {
      applicationId?: string;
      paymentMethodId?: string;
    };

    if (!body.applicationId || !body.paymentMethodId) {
      return NextResponse.json({ ok: false, error: '入力内容をご確認ください' }, { status: 400 });
    }

    const result = await updateApplicationPaymentMethod({
      memberId,
      applicationId: body.applicationId,
      paymentMethodId: body.paymentMethodId,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('HANAKAI_APP_PAYMENT_REASSIGN_FATAL', {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: false, error: '支払い方法の変更に失敗しました' }, { status: 500 });
  }
}
