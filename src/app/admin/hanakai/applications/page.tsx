import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminApplicationProcessed } from '@/components/admin/hanakai/hanakai-admin-application-actions';
import { AdminSearchBar, AdminSelectFilter } from '@/components/admin/hanakai/hanakai-admin-filters';
import { AdminFlashBanner } from '@/components/admin/hanakai/hanakai-admin-flash';
import {
  HostParticipantSelection,
  type HostApplicantCard,
  type HostMemberRow,
} from '@/components/connection/events/host-participant-selection';
import { adminFlashMessage } from '@/lib/connection/hanakai-admin-flash';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import {
  listHanakaiAdminApplications,
  listHanakaiAdminEventOptions,
} from '@/lib/connection/hanakai-admin-repo';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';
import { applicationStatusAdminTone, applicationStatusHostLabel } from '@/lib/connection/participation-finalize';
import { isIdentityVerified } from '@/lib/connection/trust';
import { getEvent, getMember, listApplications } from '@/lib/connection/repo';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'pending', label: '選定待ち' },
  { value: 'awaiting_confirmation', label: '参加確認待ち' },
  { value: 'confirmed', label: '参加確定' },
  { value: 'rejected', label: '今回のご案内なし' },
  { value: 'cancelled', label: '辞退済み' },
];


async function EventFinalizePanel({ eventId }: { eventId: string }) {
  const event = await getEvent(eventId);
  if (!event) return null;

  const applications = await listApplications(eventId);
  const pending = applications.filter((a) => a.status === 'pending');
  const selectedMembersApps = applications.filter((a) =>
    ['awaiting_confirmation', 'confirmed', 'cancelled'].includes(a.status),
  );

  const memberIds = [...new Set(applications.map((a) => a.memberId))];
  const memberList = await Promise.all(memberIds.map((mid) => getMember(mid)));
  const memberMap = new Map(memberList.filter(Boolean).map((m) => [m!.id, m!]));

  const pendingApplicants: HostApplicantCard[] = pending
    .map((app) => {
      const m = memberMap.get(app.memberId);
      if (!m) return null;
      return {
        applicationId: app.id,
        memberId: m.id,
        nickname: m.nickname,
        age: m.age,
        area: m.area,
        avatarUrl: memberMainPhotoUrl(m),
        bio: m.bio,
        reason: app.reason ?? '',
        interestTags: m.interestTags,
        identityVerified: isIdentityVerified(m),
      };
    })
    .filter(Boolean) as HostApplicantCard[];

  const selectedMembers: HostMemberRow[] = selectedMembersApps
    .map((app) => {
      const m = memberMap.get(app.memberId);
      if (!m) return null;
      return {
        applicationId: app.id,
        memberId: m.id,
        nickname: m.nickname,
        age: m.age,
        area: m.area,
        avatarUrl: memberMainPhotoUrl(m),
        status: app.status,
        statusLabel: applicationStatusHostLabel(app.status),
      };
    })
    .filter(Boolean) as HostMemberRow[];

  return (
    <section className='rounded-2xl border border-[#ebe7dd] bg-white p-4 md:p-5'>
      <div className='mb-4 space-y-1'>
        <p className='text-xs font-semibold tracking-[0.14em] text-[#1f5d4f]'>参加メンバー選定</p>
        <h2 className='text-base font-semibold text-[#1a1a1a]'>{event.title}</h2>
        <p className='text-xs text-[#6b6b6b]'>
          定員 {event.capacity}名 · 選定待ち {pending.length}件
          {event.participantsDecidedAt ? ' · 決定済み' : ''}
        </p>
      </div>
      <HostParticipantSelection
        eventId={event.id}
        eventTitle={event.title}
        capacity={event.capacity}
        participantsDecided={Boolean(event.participantsDecidedAt)}
        pendingApplicants={pendingApplicants}
        selectedMembers={selectedMembers.filter((m) => m.status !== 'cancelled')}
        redirectPath={`/admin/hanakai/applications?eventId=${event.id}`}
        asAdmin
      />
    </section>
  );
}

async function ApplicationsContent({
  status,
  eventId,
  memberQuery,
}: {
  status: 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'cancelled' | 'all';
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
              <th className='px-4 py-3 font-medium'>処理日時</th>
              <th className='px-4 py-3 font-medium'>備考</th>
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
                  <Badge tone={applicationStatusAdminTone(a.status)}>{applicationStatusHostLabel(a.status)}</Badge>
                </td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(a.decidedAt)}</td>
                <td className='px-4 py-3'>
                  {a.status === 'pending' ? (
                    <Link
                      href={`/admin/hanakai/applications?eventId=${a.eventId}&status=pending`}
                      className='text-[11px] text-[#1f5d4f] underline-offset-2 hover:underline'
                    >
                      イベントで一括選定
                    </Link>
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
              <Badge tone={applicationStatusAdminTone(a.status)}>{applicationStatusHostLabel(a.status)}</Badge>
            </div>
            {a.reason ? <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{a.reason}</p> : null}
            <p className='mt-2 text-[11px] text-[#9a9a9a]'>申請: {formatAdminDate(a.appliedAt)}</p>
            {a.decidedAt ? (
              <p className='text-[11px] text-[#9a9a9a]'>処理: {formatAdminDate(a.decidedAt)}</p>
            ) : null}
            {a.status === 'pending' ? (
              <Link
                href={`/admin/hanakai/applications?eventId=${a.eventId}&status=pending`}
                className='mt-3 inline-flex text-[11px] font-medium text-[#1f5d4f] underline-offset-2 hover:underline'
              >
                イベントで一括選定 →
              </Link>
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
    ['pending', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled'].includes(statusRaw)
      ? statusRaw
      : 'all'
  ) as 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'cancelled' | 'all';

  const flash = adminFlashMessage(param(sp, 'success'), param(sp, 'error'));
  const resolvedEventId = eventId && eventId !== 'all' ? eventId : '';

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='APPLICATIONS'
        title='参加申請一覧'
        description='イベント単位で参加メンバーを一括選定します。申請一覧は状態確認・監査用です。'
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

      {resolvedEventId ? (
        <Suspense fallback={<div className='h-40 animate-pulse rounded-2xl bg-[#ebe7dd]' />}>
          <EventFinalizePanel eventId={resolvedEventId} />
        </Suspense>
      ) : (
        <p className='rounded-2xl border border-dashed border-[#e2ddd2] bg-white px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          参加メンバーを決定するには、上のフィルターからイベントを選択してください。
        </p>
      )}

      <Suspense
        fallback={
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded-2xl bg-[#ebe7dd]' />
            ))}
          </div>
        }
      >
        <ApplicationsContent status={status} eventId={resolvedEventId} memberQuery={memberQuery} />
      </Suspense>
    </div>
  );
}
