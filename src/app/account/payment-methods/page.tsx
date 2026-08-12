import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { PaymentMethodsManager } from '@/components/connection/payments/payment-methods-manager';
import {
  listPaymentMethods,
  listApplicationsUsingPaymentMethod,
} from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';
import { formatHanakaiUsageFee, HANAKAI_USAGE_FEE_LABEL } from '@/lib/connection/hanakai-usage-fee';
import { getHanakaiUsageFeeJpy } from '@/lib/connection/hanakai-usage-fee/server';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function AccountPaymentMethodsPage() {
  const viewer = await getHanakaiViewer();
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login?next=/account/payment-methods');

  const methods = await listPaymentMethods(memberId);
  const usageFeeJpy = await getHanakaiUsageFeeJpy();

  const boundApplications = (
    await Promise.all(
      methods.map(async (m) => {
        const apps = await listApplicationsUsingPaymentMethod({
          memberId,
          paymentMethodId: m.id,
        });
        return apps.map((a) => ({
          applicationId: a.applicationId,
          eventId: a.eventId,
          eventTitle: a.eventTitle,
          paymentMethodId: m.id,
        }));
      }),
    )
  ).flat();

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
            {formatHanakaiUsageFee(usageFeeJpy)}が自動請求されます。カード番号全体は保存・表示されません。
          </p>
        </div>

        <PaymentMethodsManager
          initialMethods={methods.map((m) => ({
            id: m.id,
            brand: m.brand,
            last4: m.last_4,
            expMonth: m.exp_month,
            expYear: m.exp_year,
            isDefault: m.is_default,
          }))}
          boundApplications={boundApplications}
        />
      </div>
    </ConnectionShell>
  );
}
