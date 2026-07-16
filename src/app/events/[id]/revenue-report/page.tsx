import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { RevenueReportForm } from '@/components/connection/events/revenue-report-form';
import { RevenueFeeCalculator } from '@/components/connection/events/revenue-fee-calculator';
import { Card } from '@/components/connection/ui';
import {
  REVENUE_REPORT_STATUS_LABEL,
  BILLING_TARGET_LABEL,
  INVOICE_PAYMENT_STATUS_LABEL,
} from '@/lib/connection/event-operations/types';
import {
  countActiveCheckins,
  getInvoiceByReportId,
  getRevenueReportByEventId,
} from '@/lib/connection/event-operations/repo';
import { getEvent } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventRevenueReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewerMemberId = await getViewerMemberId();
  if (!viewerMemberId || event.hostId !== viewerMemberId) {
    redirect(`/events/${id}`);
  }

  const viewer = await getHanakaiViewer();
  const report = await getRevenueReportByEventId(id);
  const hanakaiCount = await countActiveCheckins(id);
  const submitted = sp.submitted === '1';
  const requested = sp.requested === '1';

  if (report && report.status !== 'revision_requested') {
    const invoice = await getInvoiceByReportId(report.id);
    return (
      <ConnectionShell viewer={viewer}>
        <div className='mx-auto max-w-2xl space-y-6'>
          <Link href={`/events/manage/${id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← 管理画面へ
          </Link>
          {submitted ? (
            <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
              売上報告を受け付けました。運営が内容を確認します。
            </p>
          ) : null}
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>REVENUE REPORT</p>
            <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>売上報告（提出済み）</h1>
            <p className='mt-1 text-sm text-[#6b6b6b]'>{event.title}</p>
          </div>
          {report.revisionReason ? (
            <p className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-3 text-sm text-[#8a6d45]'>
              修正依頼: {report.revisionReason}
            </p>
          ) : null}
          <Card className='space-y-3'>
            <p className='text-sm'>
              ステータス: <strong>{REVENUE_REPORT_STATUS_LABEL[report.status]}</strong>
            </p>
            <p className='text-sm text-[#6b6b6b]'>
              実参加 {report.totalParticipants}人 · 税込売上 ¥{report.grossSalesTaxIncluded.toLocaleString()}
            </p>
          </Card>
          {report.breakdown ? (
            <RevenueFeeCalculator
              hanakaiCheckinCount={report.breakdown.hanakaiCheckinCount}
              totalParticipants={report.breakdown.totalParticipants}
              grossSalesTaxIncluded={report.breakdown.grossSalesTaxIncluded}
              salesTaxRate={report.breakdown.salesTaxRate}
              billingTaxRate={report.breakdown.billingTaxRate}
            />
          ) : null}
          {invoice ? (
            <Card className='space-y-2'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>請求情報</p>
              <dl className='grid gap-1 text-sm text-[#6b6b6b]'>
                <div>請求番号: {invoice.invoiceNumber}</div>
                <div>請求先: {invoice.billingName}（{BILLING_TARGET_LABEL[invoice.billingTarget]}）</div>
                <div>請求額: ¥{invoice.totalAmountTaxIncluded.toLocaleString()}（税込）</div>
                <div>支払状態: {INVOICE_PAYMENT_STATUS_LABEL[invoice.paymentStatus]}</div>
                <div>支払期限: {invoice.dueDate}</div>
              </dl>
            </Card>
          ) : null}
          {report.documents && report.documents.length > 0 ? (
            <Card>
              <p className='mb-3 text-sm font-semibold'>提出証憑</p>
              <ul className='space-y-2'>
                {report.documents.map((doc) => (
                  <li key={doc.id}>
                    {doc.documentUrl ? (
                      <a href={doc.documentUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-[#1f5d4f] underline-offset-2 hover:underline'>
                        {doc.fileName ?? doc.documentType}
                      </a>
                    ) : (
                      <span className='text-sm text-[#6b6b6b]'>{doc.fileName ?? doc.documentType}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </ConnectionShell>
    );
  }

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-2xl space-y-6'>
        <Link href={`/events/manage/${id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
          ← 管理画面へ
        </Link>
        {requested ? (
          <p className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-3 text-sm text-[#4a4a4a]'>
            イベントの売上をご報告ください。
          </p>
        ) : null}
        {report?.revisionReason ? (
          <p className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-3 text-sm text-[#8a6d45]'>
            修正依頼: {report.revisionReason}
          </p>
        ) : null}
        <div>
          <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>REVENUE REPORT</p>
          <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>売上報告</h1>
          <p className='mt-1 text-sm text-[#6b6b6b]'>{event.title}</p>
        </div>
        <RevenueReportForm eventId={id} eventTitle={event.title} hanakaiCheckinCount={hanakaiCount} />
      </div>
    </ConnectionShell>
  );
}
