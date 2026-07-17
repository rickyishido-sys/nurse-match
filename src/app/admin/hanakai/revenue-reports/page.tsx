import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { HanakaiAdminRevenueReportActions } from '@/components/admin/hanakai/hanakai-admin-revenue-report-actions';
import { AdminFlashBanner } from '@/components/admin/hanakai/hanakai-admin-flash';
import { adminFlashMessage } from '@/lib/connection/hanakai-admin-flash';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import { listRevenueReports } from '@/lib/connection/event-operations/repo';
import { REVENUE_REPORT_STATUS_LABEL } from '@/lib/connection/event-operations/types';
import { getEvent } from '@/lib/connection/repo';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusTone = {
  draft: 'gray' as const,
  submitted: 'amber' as const,
  revision_requested: 'beige' as const,
  approved: 'green' as const,
  rejected: 'gray' as const,
};

async function RevenueReportsContent() {
  const reports = await listRevenueReports();
  if (reports.length === 0) {
    return <AdminEmptyState title='売上報告はまだありません' description='イベント終了後に主催者から提出されます。' />;
  }

  const eventTitles = new Map<string, string>();
  for (const r of reports) {
    if (!eventTitles.has(r.eventId)) {
      const ev = await getEvent(r.eventId);
      eventTitles.set(r.eventId, ev?.title ?? r.eventId.slice(0, 8));
    }
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>提出日時</th>
              <th className='px-4 py-3 font-medium'>イベント</th>
              <th className='px-4 py-3 font-medium'>実参加</th>
              <th className='px-4 py-3 font-medium'>税込売上</th>
              <th className='px-4 py-3 font-medium'>ステータス</th>
              <th className='px-4 py-3 font-medium'>証憑</th>
              <th className='px-4 py-3 font-medium'>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(r.submittedAt)}</td>
                <td className='px-4 py-3'>
                  <Link href={`/events/${r.eventId}`} className='text-[#1f5d4f] hover:underline'>
                    {eventTitles.get(r.eventId)}
                  </Link>
                </td>
                <td className='px-4 py-3'>{r.totalParticipants}人</td>
                <td className='px-4 py-3'>¥{r.grossSalesTaxIncluded.toLocaleString()}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone[r.status]}>{REVENUE_REPORT_STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className='px-4 py-3 text-[11px] text-[#6b6b6b]'>
                  <Link href={`/events/${r.eventId}/revenue-report`} className='text-[#1f5d4f] hover:underline'>
                    証憑確認 →
                  </Link>
                </td>
                <td className='px-4 py-3'>
                  <HanakaiAdminRevenueReportActions report={r} eventTitle={eventTitles.get(r.eventId) ?? ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {reports.map((r) => (
          <div key={r.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <p className='text-sm font-semibold'>{eventTitles.get(r.eventId)}</p>
            <p className='mt-1 text-xs text-[#6b6b6b]'>
              {formatAdminDate(r.submittedAt)} · {r.totalParticipants}人 · ¥{r.grossSalesTaxIncluded.toLocaleString()}
            </p>
            <div className='mt-2'>
              <Badge tone={statusTone[r.status]}>{REVENUE_REPORT_STATUS_LABEL[r.status]}</Badge>
            </div>
            <div className='mt-3'>
              <HanakaiAdminRevenueReportActions report={r} eventTitle={eventTitles.get(r.eventId) ?? ''} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminRevenueReportsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const flash = adminFlashMessage(param(sp, 'updated'), param(sp, 'error'));
  return (
    <div className='space-y-6'>
      <AdminPageHeader title='売上報告一覧' description='主催者から提出された売上報告の確認・承認・修正依頼' />
      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}
      <Suspense fallback={<p className='text-sm text-[#9a9a9a]'>読み込み中…</p>}>
        <RevenueReportsContent />
      </Suspense>
    </div>
  );
}
