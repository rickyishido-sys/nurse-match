import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { HanakaiAdminInvoiceActions } from '@/components/admin/hanakai/hanakai-admin-invoice-actions';
import { AdminFlashBanner } from '@/components/admin/hanakai/hanakai-admin-flash';
import { adminFlashMessage } from '@/lib/connection/hanakai-admin-flash';
import { AdminEmptyState } from '@/components/admin/hanakai/hanakai-admin-shared';
import { listInvoices } from '@/lib/connection/event-operations/repo';
import { BILLING_TARGET_LABEL, INVOICE_PAYMENT_STATUS_LABEL } from '@/lib/connection/event-operations/types';
import { getEvent } from '@/lib/connection/repo';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const payTone = {
  pending: 'amber' as const,
  paid: 'green' as const,
  overdue: 'beige' as const,
  cancelled: 'gray' as const,
};

async function InvoicesContent() {
  const invoices = await listInvoices();
  if (invoices.length === 0) {
    return <AdminEmptyState title='請求はまだありません' description='売上報告提出後に自動作成されます。' />;
  }

  const eventTitles = new Map<string, string>();
  for (const inv of invoices) {
    if (!eventTitles.has(inv.eventId)) {
      const ev = await getEvent(inv.eventId);
      eventTitles.set(inv.eventId, ev?.title ?? inv.eventId.slice(0, 8));
    }
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>請求番号</th>
              <th className='px-4 py-3 font-medium'>イベント</th>
              <th className='px-4 py-3 font-medium'>請求先</th>
              <th className='px-4 py-3 font-medium'>請求額</th>
              <th className='px-4 py-3 font-medium'>請求日</th>
              <th className='px-4 py-3 font-medium'>支払期限</th>
              <th className='px-4 py-3 font-medium'>支払状態</th>
              <th className='px-4 py-3 font-medium'>操作</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='px-4 py-3 font-mono text-xs'>{inv.invoiceNumber}</td>
                <td className='px-4 py-3'>
                  <Link href={`/events/${inv.eventId}`} className='text-[#1f5d4f] hover:underline'>
                    {eventTitles.get(inv.eventId)}
                  </Link>
                </td>
                <td className='px-4 py-3 text-xs'>
                  {inv.billingName}
                  <span className='block text-[#9a9a9a]'>{BILLING_TARGET_LABEL[inv.billingTarget]}</span>
                </td>
                <td className='px-4 py-3 font-semibold'>¥{inv.totalAmountTaxIncluded.toLocaleString()}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{inv.invoiceDate}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{inv.dueDate}</td>
                <td className='px-4 py-3'>
                  <Badge tone={payTone[inv.paymentStatus]}>{INVOICE_PAYMENT_STATUS_LABEL[inv.paymentStatus]}</Badge>
                </td>
                <td className='px-4 py-3'>
                  <HanakaiAdminInvoiceActions invoice={inv} eventTitle={eventTitles.get(inv.eventId) ?? ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {invoices.map((inv) => (
          <div key={inv.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <p className='font-mono text-xs text-[#6b6b6b]'>{inv.invoiceNumber}</p>
            <p className='mt-1 text-sm font-semibold'>{eventTitles.get(inv.eventId)}</p>
            <p className='text-xs text-[#6b6b6b]'>
              {inv.billingName} · ¥{inv.totalAmountTaxIncluded.toLocaleString()} · 期限 {inv.dueDate}
            </p>
            <div className='mt-2'>
              <Badge tone={payTone[inv.paymentStatus]}>{INVOICE_PAYMENT_STATUS_LABEL[inv.paymentStatus]}</Badge>
            </div>
            <div className='mt-3'>
              <HanakaiAdminInvoiceActions invoice={inv} eventTitle={eventTitles.get(inv.eventId) ?? ''} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminInvoicesPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const flash = adminFlashMessage(param(sp, 'updated'), param(sp, 'error'));
  return (
    <div className='space-y-6'>
      <AdminPageHeader title='請求一覧・支払管理' description='送客サービス利用料の請求書・支払状態の管理（将来Stripe連携予定）' />
      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}
      <Suspense fallback={<p className='text-sm text-[#9a9a9a]'>読み込み中…</p>}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}
