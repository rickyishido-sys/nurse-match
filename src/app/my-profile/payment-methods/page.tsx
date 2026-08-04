import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { listPaymentMethods } from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';
import { formatHanakaiUsageFee, HANAKAI_USAGE_FEE_LABEL } from '@/lib/connection/hanakai-usage-fee';
import { getHanakaiUsageFeeJpy } from '@/lib/connection/hanakai-usage-fee/server';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { redirect } from 'next/navigation';

export default async function PaymentMethodsPage() {
  const viewer = await getHanakaiViewer();
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile/payment-methods');

  const methods = await listPaymentMethods(memberId);
  const usageFeeJpy = await getHanakaiUsageFeeJpy();

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-lg space-y-6 px-5 py-8'>
        <div>
          <Link href='/my-profile' className='text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← プロフィール
          </Link>
          <h1 className='mt-3 text-xl font-semibold text-[#1a1a1a]'>お支払い方法</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            参加メンバーに選ばれた場合のみ、{HANAKAI_USAGE_FEE_LABEL}
            {formatHanakaiUsageFee(usageFeeJpy)}が自動請求されます。
          </p>
        </div>

        {methods.length === 0 ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-5 text-sm text-[#6b6b6b]'>
            登録済みのカードはありません。イベントへ初めて参加申請する際に登録できます。
          </p>
        ) : (
          <ul className='space-y-3'>
            {methods.map((m) => (
              <li key={m.id} className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-4'>
                <p className='text-sm font-semibold text-[#1a1a1a]'>
                  {m.brand ?? 'カード'} •••• {m.last_4 ?? '****'}
                  {m.is_default ? (
                    <span className='ml-2 rounded-full bg-[#eef4f0] px-2 py-0.5 text-[10px] font-semibold text-[#1f5d4f]'>
                      デフォルト
                    </span>
                  ) : null}
                </p>
                {m.exp_month && m.exp_year ? (
                  <p className='mt-1 text-xs text-[#9a9a9a]'>
                    有効期限 {m.exp_month}/{m.exp_year}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ConnectionShell>
  );
}
