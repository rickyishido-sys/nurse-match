import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { Card, Chip } from '@/components/connection/ui';
import { confirmMemberAction, removeMemberAction } from '@/lib/connection/actions';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  EVENT_CATEGORY_LABEL,
  formatEventDate,
  getEvent,
  getMember,
  listApplications,
  listEvents,
  MOTIVATION_LABEL,
} from '@/lib/connection/data';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ManagePage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const selectedEventId = typeof sp.event === 'string' ? sp.event : listEvents().find((e) => !e.isPast)?.id ?? '';
  const event = getEvent(selectedEventId);
  const applications = selectedEventId ? listApplications(selectedEventId) : [];
  const pending = applications.filter((a) => a.status === 'pending');
  const confirmed = applications.filter((a) => a.status === 'confirmed');

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div>
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>ADMIN</p>
          <h1 className='mt-1 text-xl font-semibold text-[#1a1a1a]'>参加者選定</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            参加希望者を確認し、6名を手動で選定します（AI不要・MVP）。
          </p>
        </div>

        {/* Event selector */}
        <div className='space-y-2'>
          <p className='text-xs font-medium text-[#6b6b6b]'>イベントを選択</p>
          <div className='flex flex-wrap gap-2'>
            {listEvents()
              .filter((e) => !e.isPast)
              .map((e) => (
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
                確定 {event.confirmedMemberIds.length}/{event.capacity}名 · 申込 {applications.length}件
              </p>
            </Card>

            {/* Confirmed members */}
            {confirmed.length > 0 ? (
              <section>
                <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>確定メンバー</h2>
                <div className='space-y-2'>
                  {confirmed.map((app) => {
                    const member = getMember(app.memberId);
                    if (!member) return null;
                    return (
                      <Card key={app.id} className='flex items-center justify-between p-3'>
                        <MemberRow member={member} />
                        <form action={removeMemberAction}>
                          <input type='hidden' name='eventId' value={event.id} />
                          <input type='hidden' name='memberId' value={member.id} />
                          <button type='submit' className='rounded-full border border-[#d8d6d1] px-3 py-1 text-[11px] text-[#6b6b6b]'>
                            解除
                          </button>
                        </form>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Pending applications */}
            <section>
              <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>参加希望者一覧</h2>
              {pending.length === 0 ? (
                <p className='text-xs text-[#9a9a9a]'>参加希望者はいません。</p>
              ) : (
                <div className='space-y-3'>
                  {pending.map((app) => {
                    const member = getMember(app.memberId);
                    if (!member) return null;
                    const atCapacity = event.confirmedMemberIds.length >= event.capacity;
                    return (
                      <Card key={app.id}>
                        <MemberRow member={member} />
                        <form action={confirmMemberAction} className='mt-3'>
                          <input type='hidden' name='eventId' value={event.id} />
                          <input type='hidden' name='memberId' value={member.id} />
                          <button
                            type='submit'
                            disabled={atCapacity}
                            className='h-10 w-full rounded-full bg-[#1a1a1a] text-xs font-semibold text-white disabled:opacity-40'
                          >
                            {atCapacity ? '定員に達しています' : 'このイベントに割当'}
                          </button>
                        </form>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </ConnectionShell>
  );
}

function MemberRow({ member }: { member: NonNullable<ReturnType<typeof getMember>> }) {
  return (
    <div className='flex gap-3'>
      <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-full'>
        <Image src={member.avatarUrl} alt={member.nickname} fill className='object-cover' />
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>{member.nickname}</p>
        <p className='text-xs text-[#6b6b6b]'>{member.age}歳 · {member.area} · {member.occupation}</p>
        <p className='mt-1 line-clamp-2 text-xs text-[#4a4a4a]'>{member.bio}</p>
        <div className='mt-1 flex flex-wrap gap-1'>
          {member.motivations.slice(0, 3).map((m) => (
            <Chip key={m} tone='muted'>{MOTIVATION_LABEL[m]}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
