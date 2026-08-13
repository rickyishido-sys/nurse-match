import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { HostBadgeList } from '@/components/connection/host-badge';
import { HostCheckinPanel } from '@/components/connection/events/host-checkin-panel';
import {
  HostParticipantSelection,
  type HostApplicantCard,
  type HostMemberRow,
} from '@/components/connection/events/host-participant-selection';
import { IdentityRequiredPanel } from '@/components/connection/identity-required-panel';
import { Card } from '@/components/connection/ui';
import { formatEventDate } from '@/lib/connection/data';
import { getEventOperationsMeta, listEventCheckins } from '@/lib/connection/event-operations/repo';
import { getEventEligibility } from '@/lib/connection/identity-gate';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';
import { applicationStatusHostLabel } from '@/lib/connection/participation-finalize';
import { getEventCapacityBreakdown } from '@/lib/connection/participation-payment';
import { isIdentityVerified } from '@/lib/connection/trust';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getEvent, getMember, listApplications } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManageEventPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const isHost = !!viewerMemberId && event.hostId === viewerMemberId;
  const hostMember = viewerMemberId ? await getMember(viewerMemberId) : null;

  if (!isHost) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='space-y-5'>
          <Link href={`/events/${event.id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント詳細へ
          </Link>
          <Card className='text-center'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>主催者のみが管理できます</p>
            <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
              この画面は、このイベントを主催している方だけがご覧いただけます。
            </p>
          </Card>
        </div>
      </ConnectionShell>
    );
  }

  const eligibility = getEventEligibility(hostMember);
  if (!eligibility.canApproveApplications) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='space-y-5'>
          <Link href={`/events/${event.id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント詳細へ
          </Link>
          <IdentityRequiredPanel laterHref='/my-profile' />
        </div>
      </ConnectionShell>
    );
  }

  const applications = await listApplications(event.id);
  const pending = applications.filter((a) => a.status === 'pending');
  const selectedMembersApps = applications.filter((a) =>
    [
      'payment_processing',
      'payment_failed',
      'awaiting_confirmation',
      'confirmed',
      'cancelled',
      'payment_expired',
      'not_selected',
      'rejected',
    ].includes(a.status),
  );

  const capacityBreakdown = await getEventCapacityBreakdown(event.id);

  const memberIds = [...new Set(applications.map((a) => a.memberId))];
  const memberList = await Promise.all(memberIds.map((mid) => getMember(mid)));
  const memberMap = new Map(memberList.filter(Boolean).map((m) => [m!.id, m!]));

  const opsMeta = await getEventOperationsMeta(event.id);
  const checkins = await listEventCheckins(event.id);

  const finalized = capacityBreakdown ? capacityBreakdown.additionalSlots <= 0 && pending.length === 0 : Boolean(event.participantsDecidedAt);
  const justFinalized = sp.finalized === '1' || sp.success === 'finalized';
  const errorMsg = typeof sp.error === 'string' ? sp.error : '';

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

  const confirmedForCheckin = selectedMembersApps
    .filter((a) => a.status === 'confirmed')
    .map((a) => memberMap.get(a.memberId))
    .filter(Boolean) as NonNullable<(typeof memberList)[number]>[];

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div className='space-y-3'>
          <Link href={`/events/${event.id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント詳細へ
          </Link>
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>HOST MANAGEMENT</p>
            <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
            <p className='mt-1 text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
          </div>
          <HostBadgeList badges={hostMember?.hostBadges} />
        </div>

        {justFinalized ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            参加メンバーを決定しました。申請者へ通知を送信しました。
          </p>
        ) : null}
        {errorMsg ? (
          <p className='rounded-2xl border border-[#f0dede] bg-[#fdf8f8] px-4 py-3 text-xs text-[#8b4545]' role='alert'>
            {errorMsg}
          </p>
        ) : null}

        <section className='space-y-2'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>
            {finalized ? '参加メンバー' : `参加希望者 ${pending.length}名`}
          </h2>
          <HostParticipantSelection
            eventId={event.id}
            eventTitle={event.title}
            capacity={event.capacity}
            participantsDecided={finalized}
            pendingApplicants={pendingApplicants}
            selectedMembers={selectedMembers.filter((m) => m.status !== 'cancelled')}
            redirectPath={`/events/manage/${event.id}`}
          />
        </section>

        <HostCheckinPanel
          eventId={event.id}
          hasCheckinCode={opsMeta?.hasCheckinCode ?? false}
          currentCheckinCode={opsMeta?.checkinCode ?? null}
          newCheckinCode={typeof sp.new_checkin_code === 'string' ? sp.new_checkin_code : null}
          regenerated={sp.checkin_regen === '1'}
          regenError={sp.regen_error === '1'}
          confirmedMembers={confirmedForCheckin}
          checkins={checkins}
          endedAt={opsMeta?.endedAt}
        />
      </div>
    </ConnectionShell>
  );
}
