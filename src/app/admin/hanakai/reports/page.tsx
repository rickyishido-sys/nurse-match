import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminReportActions } from '@/components/admin/hanakai/hanakai-admin-report-actions';
import { AdminSelectFilter } from '@/components/admin/hanakai/hanakai-admin-filters';
import { AdminFlashBanner, adminFlashMessage } from '@/components/admin/hanakai/hanakai-admin-flash';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import {
  REPORT_STATUS_LABEL,
  listHanakaiAdminReports,
} from '@/lib/connection/hanakai-admin-repo';
import type { AdminReportStatus } from '@/lib/connection/hanakai-admin-types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusOptions = [
  { value: 'active', label: '要対応（open / reviewing）' },
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未対応' },
  { value: 'reviewing', label: '確認中' },
  { value: 'resolved', label: '対応済み' },
  { value: 'dismissed', label: 'dismissed' },
];

const statusTone = {
  open: 'amber' as const,
  reviewing: 'beige' as const,
  resolved: 'green' as const,
  dismissed: 'gray' as const,
};

async function ReportsContent({ statusFilter }: { statusFilter: AdminReportStatus | 'all' | 'active' }) {
  const reports = await listHanakaiAdminReports({ status: statusFilter });

  if (reports.length === 0) {
    return (
      <AdminEmptyState
        title='現在対応が必要な通報はありません'
        description={statusFilter === 'active' ? 'open / reviewing の通報はありません。' : '該当する通報がありません。'}
      />
    );
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>通報日時</th>
              <th className='px-4 py-3 font-medium'>通報者</th>
              <th className='px-4 py-3 font-medium'>通報対象</th>
              <th className='px-4 py-3 font-medium'>理由</th>
              <th className='px-4 py-3 font-medium'>詳細</th>
              <th className='px-4 py-3 font-medium'>ステータス</th>
              <th className='px-4 py-3 font-medium'>対応日時</th>
              <th className='px-4 py-3 font-medium'>対応者</th>
              <th className='px-4 py-3 font-medium'>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(r.createdAt)}</td>
                <td className='px-4 py-3'>{r.reporterNickname}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{r.targetLabel}</td>
                <td className='max-w-[120px] truncate px-4 py-3'>{r.reason || '—'}</td>
                <td className='max-w-[160px] truncate px-4 py-3 text-[#6b6b6b]'>{r.detail || '—'}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(r.resolvedAt)}</td>
                <td className='px-4 py-3'>{r.resolvedByNickname ?? '—'}</td>
                <td className='px-4 py-3'>
                  <AdminReportActions reportId={r.id} status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {reports.map((r) => (
          <article key={r.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='text-xs text-[#9a9a9a]'>{formatAdminDate(r.createdAt)}</p>
                <p className='font-semibold text-[#1a1a1a]'>{r.targetLabel}</p>
                <p className='text-xs text-[#6b6b6b]'>通報者: {r.reporterNickname}</p>
              </div>
              <Badge tone={statusTone[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
            </div>
            {r.reason ? <p className='mt-2 text-xs text-[#1a1a1a]'>理由: {r.reason}</p> : null}
            {r.detail ? <p className='mt-1 text-xs text-[#6b6b6b]'>{r.detail}</p> : null}
            <div className='mt-3'>
              <AdminReportActions reportId={r.id} status={r.status} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminReportsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const statusRaw = param(sp, 'status') || 'active';
  const statusFilter = (
    ['active', 'all', 'open', 'reviewing', 'resolved', 'dismissed'].includes(statusRaw)
      ? statusRaw
      : 'active'
  ) as AdminReportStatus | 'all' | 'active';

  const flash = adminFlashMessage(param(sp, 'success'), param(sp, 'error'));

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='REPORTS'
        title='通報 inbox'
        description='ユーザーからの通報を確認・ステータス更新します。対象の非表示・利用停止は Phase 3 以降で追加予定です。'
      />

      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}

      <Suspense fallback={null}>
        <AdminSelectFilter paramKey='status' label='ステータス' options={statusOptions} defaultValue='active' />
      </Suspense>

      <Suspense
        fallback={
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded-2xl bg-[#ebe7dd]' />
            ))}
          </div>
        }
      >
        <ReportsContent statusFilter={statusFilter} />
      </Suspense>
    </div>
  );
}
