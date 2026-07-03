import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import {
  AdminApplicationActions,
  AdminApplicationProcessed,
} from '@/components/admin/hanakai/hanakai-admin-application-actions';
import { AdminSearchBar, AdminSelectFilter } from '@/components/admin/hanakai/hanakai-admin-filters';
import { AdminFlashBanner, adminFlashMessage } from '@/components/admin/hanakai/hanakai-admin-flash';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import {
  listHanakaiAdminApplications,
  listHanakaiAdminEventOptions,
} from '@/lib/connection/hanakai-admin-repo';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'pending', label: '承認待ち' },
  { value: 'confirmed', label: '承認済み' },
  { value: 'rejected', label: '却下済み' },
];

const statusTone = {
  pending: 'amber' as const,
  confirmed: 'green' as const,
  rejected: 'redSoft' as const,
};

const statusLabel = {
  pending: '承認待ち',
  confirmed: '承認済み',
  rejected: '却下',
};

async function ApplicationsContent({
  status,
  eventId,
  memberQuery,
}: {
  status: 'pending' | 'confirmed' | 'rejected' | 'all';
  eventId: string;
  memberQuery: string;
}) {
  const applications = await listHanakaiAdminApplications({ status, eventId: eventId || undefined, memberQuery });

  if (applications.length === 0) {
    return <AdminEmptyState title='該当する参加申請が見つかりません' />;
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>イベント</th>
              <th className='px-4 py-3 font-medium'>申請者</th>
              <th className='px-4 py-3 font-medium'>申請理由</th>
              <th className='px-4 py-3 font-medium'>申請日時</th>
              <th className='px-4 py-3 font-medium'>ステータス</th>
              <th className='px-4 py-3 font-medium'>承認/却下日時</th>
              <th className='px-4 py-3 font-medium'>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='max-w-[160px] truncate px-4 py-3'>{a.eventTitle}</td>
                <td className='px-4 py-3'>
                  <Link href={`/admin/hanakai/members/${a.memberId}`} className='text-[#1f5d4f] hover:underline'>
                    {a.memberNickname}
                  </Link>
                </td>
                <td className='max-w-[200px] truncate px-4 py-3 text-[#6b6b6b]'>{a.reason || '—'}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(a.appliedAt)}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                </td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(a.decidedAt)}</td>
                <td className='px-4 py-3'>
                  {a.status === 'pending' ? (
                    <AdminApplicationActions
                      applicationId={a.id}
                      eventTitle={a.eventTitle}
                      memberNickname={a.memberNickname}
                    />
                  ) : (
                    <AdminApplicationProcessed status={a.status} decidedAt={a.decidedAt} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {applications.map((a) => (
          <article key={a.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='font-semibold text-[#1a1a1a]'>{a.eventTitle}</p>
                <Link href={`/admin/hanakai/members/${a.memberId}`} className='text-xs text-[#1f5d4f]'>
                  {a.memberNickname}
                </Link>
              </div>
              <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
            </div>
            {a.reason ? <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{a.reason}</p> : null}
            <p className='mt-2 text-[11px] text-[#9a9a9a]'>申請: {formatAdminDate(a.appliedAt)}</p>
            {a.decidedAt ? (
              <p className='text-[11px] text-[#9a9a9a]'>処理: {formatAdminDate(a.decidedAt)}</p>
            ) : null}
            {a.status === 'pending' ? (
              <div className='mt-3'>
                <AdminApplicationActions
                  applicationId={a.id}
                  eventTitle={a.eventTitle}
                  memberNickname={a.memberNickname}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

async function EventFilterOptions() {
  const events = await listHanakaiAdminEventOptions();
  const options = [{ value: 'all', label: 'すべてのイベント' }, ...events.map((e) => ({ value: e.id, label: e.title }))];
  return <AdminSelectFilter paramKey='eventId' label='イベント' options={options} defaultValue='all' />;
}

export default async function HanakaiAdminApplicationsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const memberQuery = param(sp, 'q');
  const eventId = param(sp, 'eventId');
  const statusRaw = param(sp, 'status') || 'all';
  const status = (
    statusRaw === 'pending' || statusRaw === 'confirmed' || statusRaw === 'rejected' ? statusRaw : 'all'
  ) as 'pending' | 'confirmed' | 'rejected' | 'all';

  const flash = adminFlashMessage(param(sp, 'success'), param(sp, 'error'));

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='APPLICATIONS'
        title='参加申請一覧'
        description='参加申請の承認・却下を行います。主催者による承認フローも引き続き利用できます。'
      />

      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}

      <div className='grid gap-3 md:grid-cols-[1fr_auto_auto]'>
        <Suspense fallback={<div className='h-10 animate-pulse rounded-xl bg-[#ebe7dd]' />}>
          <AdminSearchBar defaultValue={memberQuery} placeholder='申請者名で検索' paramKey='q' />
        </Suspense>
        <Suspense fallback={null}>
          <AdminSelectFilter paramKey='status' label='ステータス' options={statusOptions} defaultValue='all' />
        </Suspense>
        <Suspense fallback={null}>
          <EventFilterOptions />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded-2xl bg-[#ebe7dd]' />
            ))}
          </div>
        }
      >
        <ApplicationsContent status={status} eventId={eventId === 'all' ? '' : eventId} memberQuery={memberQuery} />
      </Suspense>
    </div>
  );
}
