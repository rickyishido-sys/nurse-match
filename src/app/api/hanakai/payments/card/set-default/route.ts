import { NextResponse } from 'next/server';
import { setDefaultPaymentMethod } from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';

export async function POST(request: Request) {
  try {
    const memberId = await getViewerMemberId();
    if (!memberId) {
      return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const body = (await request.json()) as { paymentMethodId?: string };
    if (!body.paymentMethodId) {
      return NextResponse.json({ ok: false, error: '支払い方法が指定されていません' }, { status: 400 });
    }

    const result = await setDefaultPaymentMethod({
      memberId,
      paymentMethodId: body.paymentMethodId,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      paymentMethod: {
        id: result.paymentMethod.id,
        brand: result.paymentMethod.brand,
        last4: result.paymentMethod.last_4,
        isDefault: result.paymentMethod.is_default,
      },
    });
  } catch (e) {
    console.error('HANAKAI_SET_DEFAULT_ROUTE_FATAL', {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: false, error: 'デフォルトの更新に失敗しました' }, { status: 500 });
  }
}
