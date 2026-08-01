import { NextResponse } from 'next/server';
import { savePaymentMethodFromToken } from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';

export async function POST(request: Request) {
  try {
    const memberId = await getViewerMemberId();
    if (!memberId) {
      return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });
    }

    const body = (await request.json()) as {
      sourceId?: string;
      verificationToken?: string;
      consentAccepted?: boolean;
      platform?: 'web' | 'ios' | 'android';
    };

    if (!body.sourceId) {
      return NextResponse.json({ ok: false, error: 'カード情報が不正です' }, { status: 400 });
    }

    const member = await getMember(memberId);
    const result = await savePaymentMethodFromToken({
      memberId,
      sourceId: body.sourceId,
      verificationToken: body.verificationToken,
      consentAccepted: Boolean(body.consentAccepted),
      platform: body.platform ?? 'web',
      nickname: member?.nickname,
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
        expMonth: result.paymentMethod.exp_month,
        expYear: result.paymentMethod.exp_year,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'カードの保存に失敗しました' }, { status: 500 });
  }
}
