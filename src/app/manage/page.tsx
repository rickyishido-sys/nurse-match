import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import {
  HostParticipantSelection,
  type HostApplicantCard,
  type HostMemberRow,
} from '@/components/connection/events/host-participant-selection';
import { ManageNav } from '@/components/connection/manage-nav';
import { MemberInsights } from '@/components/connection/member-insights';
import { TrustAdminPanel, TrustOperationGuide } from '@/components/connection/trust-admin-panel';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { Card } from '@/components/connection/ui';
import { removeMemberAction } from '@/lib/connection/actions';
import { EVENT_CATEGORY_LABEL, formatEventDate } from '@/lib/connection/data';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';
import { applicationStatusHostLabel } from '@/lib/connection/participation-finalize';
import { isIdentityVerified } from '@/lib/connection/trust';
import { getEvent, getMember, listApplications, listEvents } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import type { ConnectionMember } from '@/lib/connection/types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ManagePage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const upcomingEvents = (await listEvents()).filter((e) => !e.isPast);
  const selectedEventId = typeof sp.event === 'string' ? sp.event : upcomingEvents[0]?.id ?? '';
  const event = selectedEventId ? await getEvent(selectedEventId) : null;
  const applications = selectedEventId ? await listApplications(selectedEventId) : [];
  const pending = applications.filter((a) => a.status === 'pending');
  const selectedApps = applications.filter((a) =>
    ['awaiting_confirmation', 'confirmed'].includes(a.status),
  );
  const trustUpdated = typeof sp.trustUpdated === 'string' ? sp.trustUpdated : null;
  const trustUpdatedMember = trustUpdated ? await getMember(trustUpdated) : null;
  const justFinalized = sp.finalized === '1' || sp.success === 'finalized';

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

  const selectedMembers: HostMemberRow[] = selectedApps
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
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: '#b8956a' }}>
            ADMIN
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>参加者選定とConnection設計</h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            属性だけでなく、Connection目的・興味・人生フェーズ・性格タイプ・運営確認ステータス・過去の参加態度・再会希望などを参考に、
            この体験に合う参加メンバーを選定します。
          </p>
        </div>

        <ManageNav active='members' />

        <TrustOperationGuide />

        {trustUpdated ? (
          <p className='rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800'>
            {trustUpdatedMember?.nickname ?? 'メンバー'} の運営確認ステータスを更新しました。
          </p>
        ) : null}
        {justFinalized ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            参加メンバーを決定しました。申請者へ通知を送信しました。
          </p>
        ) : null}

        <div className='space-y-2'>
          <p className='text-xs font-medium text-[#6b6b6b]'>イベントを選択</p>
          <div className='flex flex-wrap gap-2'>
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                href={`/manage?event=${e.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  e.id === selectedEventId ? 'bg-[#1a1a1a] text-white' : 'border border-[#d8d6d1] bg-white text-[#6b6b6b]'
                }`}
              >
                {EVENT_CATEGORY_LABEL[e.category]}
              </Link>
            ))}
          </div>
        </div>

        {event ? (
          <>
            <Card>
              <p className='text-sm font-semibold text-[#1a1a1a]'>{event.title}</p>
              <p className='mt-1 text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
              <p className='mt-2 text-xs text-[#9a9a9a]'>
                確定 {selectedApps.filter((a) => a.status === 'confirmed').length}/{event.capacity}名 · 申込{' '}
                {applications.length}件
              </p>
            </Card>

            <section>
              <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>
                {event.participantsDecidedAt ? '参加メンバー' : `参加希望者 ${pending.length}名`}
              </h2>
              <HostParticipantSelection
                eventId={event.id}
                eventTitle={event.title}
                capacity={event.capacity}
                participantsDecided={Boolean(event.participantsDecidedAt)}
                pendingApplicants={pendingApplicants}
                selectedMembers={selectedMembers}
                redirectPath={`/manage?event=${event.id}`}
                asAdmin
              />
            </section>

            {selectedApps.length > 0 ? (
              <section>
                <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>選定メンバー詳細</h2>
                <div className='space-y-3'>
                  {selectedApps.map((app) => {
                    const member = memberMap.get(app.memberId);
                    if (!member) return null;
                    return (
                      <Card key={app.id}>
                        <MemberHeader member={member} />
                        <div className='mt-3'>
                          <MemberInsights member={member} variant='full' />
                        </div>
                        <TrustAdminPanel member={member} eventId={event.id} />
                        {app.status === 'confirmed' ? (
                          <form action={removeMemberAction} className='mt-3'>
                            <input type='hidden' name='eventId' value={event.id} />
                            <input type='hidden' name='memberId' value={member.id} />
                            <button type='submit' className='rounded-full border border-[#d8d3cb] px-3 py-1 text-[11px] text-[#6b6b6b]'>
                              参加から外す
                            </button>
                          </form>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </ConnectionShell>
  );
}

function MemberHeader({ member }: { member: ConnectionMember }) {
  return (
    <div className='flex gap-3'>
      <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-full'>
        <Image src={member.avatarUrl} alt={member.nickname} fill className='object-cover' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>{member.nickname}</p>
        <p className='text-xs text-[#6b6b6b]'>
          {member.age}歳 · {member.area} · {member.occupation}
        </p>
        <TrustBadgeList member={member} className='mt-1.5' />
        <p className='mt-1 line-clamp-2 text-xs text-[#4a4a4a]'>{member.bio}</p>
      </div>
    </div>
  );
}
