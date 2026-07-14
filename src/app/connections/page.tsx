import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getEvent, getEventMembers, listApplications } from '@/lib/connection/repo';
import { EVENT_CATEGORY_META, formatEventDate } from '@/lib/connection/data';
import type { ConnectionEvent, ConnectionMember, EventApplication } from '@/lib/connection/types';

const GOLD = '#b8956a';

type Row = { event: ConnectionEvent; application: EventApplication };

function EmptyState() {
  return (
    <div
      className='rounded-3xl border border-[#ebe5dc] px-6 py-12 text-center'
      style={{ background: 'linear-gradient(135deg, #f6f0e6 0%, #f1ece2 100%)' }}
    >
      <div className='mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-white/70'>
        <div className='relative h-12 w-12'>
          <Image src='/flow/continue.png' alt='' fill sizes='48px' className='object-contain' />
        </div>
      </div>
      <p className='text-base font-semibold text-[#1a1a1a]'>まだ参加したイベントはありません</p>
      <p className='mx-auto mt-2 max-w-xs text-xs leading-6 text-[#7a7264]'>
        イベントに参加すると、ここに出会った人との記録が表示されます。
      </p>
      <Link
        href='/events'
        className='mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-7 text-sm font-semibold text-white transition active:scale-[0.98]'
      >
        イベントを見る
      </Link>
    </div>
  );
}

function MetaLine({ event }: { event: ConnectionEvent }) {
  const meta = EVENT_CATEGORY_META[event.category];
  return (
    <p className='mt-1 text-xs text-[#6b6b6b]'>
      {meta.short} · {formatEventDate(event.startAt)}
      {event.area ? ` · ${event.area}` : ''}
    </p>
  );
}

function StatusRow({ row }: { row: Row }) {
  const { event, application } = row;
  const meta = EVENT_CATEGORY_META[event.category];
  const label =
    application.status === 'pending' || application.status === 'awaiting_confirmation'
      ? '選考中'
      : event.isPast
        ? '参加済み'
        : '参加予定';
  const tone =
    application.status === 'pending' || application.status === 'awaiting_confirmation'
      ? 'bg-[#f0eeea] text-[#6b6b6b]'
      : event.isPast
        ? 'bg-[#efe7d7] text-[#8b7355]'
        : 'bg-[#e7f0ea] text-[#1f5d4f]';
  return (
    <Link
      href={`/events/${event.id}`}
      className='flex items-center gap-4 rounded-2xl border border-[#ebe9e4] bg-white p-4 transition active:scale-[0.99]'
    >
      <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient}`}>
        {event.coverUrl ? (
          <Image src={event.coverUrl} alt='' fill className='object-cover mix-blend-multiply' />
        ) : (
          <span className='text-2xl' aria-hidden>
            {meta.emoji}
          </span>
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{event.title}</p>
        <MetaLine event={event} />
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{label}</span>
    </Link>
  );
}

function PastConnectionCard({ row, members }: { row: Row; members: ConnectionMember[] }) {
  const { event } = row;
  const meta = EVENT_CATEGORY_META[event.category];
  const others = members.slice(0, 5);
  return (
    <Link
      href={`/connections/${event.id}`}
      className='block rounded-2xl border border-[#ebe9e4] bg-white p-4 transition active:scale-[0.99]'
    >
      <div className='flex items-center gap-4'>
        <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient}`}>
          {event.coverUrl ? (
            <Image src={event.coverUrl} alt='' fill className='object-cover mix-blend-multiply' />
          ) : (
            <span className='text-2xl' aria-hidden>
              {meta.emoji}
            </span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{event.title}</p>
          <MetaLine event={event} />
        </div>
        <span className='shrink-0 text-xs font-semibold text-[#1f5d4f]'>見る →</span>
      </div>
      {members.length > 0 ? (
        <div className='mt-4 flex items-center gap-3 border-t border-[#f1efe9] pt-3'>
          <div className='flex -space-x-2'>
            {others.map((m) => (
              <div key={m.id} className='relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white'>
                <Image src={m.avatarUrl} alt={m.nickname} fill className='object-cover' />
              </div>
            ))}
          </div>
          <p className='text-xs text-[#6b6b6b]'>
            {members.length}人と出会いました
          </p>
        </div>
      ) : null}
    </Link>
  );
}

function Section({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-4'>
      <div className='space-y-1.5'>
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          {kicker}
        </p>
        <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>{title}</h2>
        {description ? <p className='text-xs leading-6 text-[#7a7264]'>{description}</p> : null}
      </div>
      <div className='space-y-3'>{children}</div>
    </section>
  );
}

export default async function ConnectionsPage() {
  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();

  // 自分の申請（却下を除く）を取得し、対応イベントを引き当てる。
  const myApps = viewerMemberId
    ? (await listApplications()).filter((a) => a.memberId === viewerMemberId && a.status !== 'rejected')
    : [];

  const eventIds = [...new Set(myApps.map((a) => a.eventId))];
  const events = await Promise.all(eventIds.map((id) => getEvent(id)));
  const eventMap = new Map<string, ConnectionEvent>();
  for (const e of events) if (e) eventMap.set(e.id, e);

  const rows: Row[] = myApps
    .map((application) => {
      const event = eventMap.get(application.eventId);
      return event ? { event, application } : null;
    })
    .filter((r): r is Row => r !== null);

  const pending = rows.filter((r) => ['pending', 'awaiting_confirmation'].includes(r.application.status)).sort(byStartAsc);
  const upcoming = rows
    .filter((r) => r.application.status === 'confirmed' && !r.event.isPast)
    .sort(byStartAsc);
  const past = rows
    .filter((r) => r.application.status === 'confirmed' && r.event.isPast)
    .sort(byStartDesc);

  // 過去Connectionで出会ったメンバーを先読み（参加者ページへの導線用）。
  const pastMembers = new Map<string, ConnectionMember[]>();
  await Promise.all(
    past.map(async (r) => {
      const members = (await getEventMembers(r.event.id)).filter((m) => m.id !== viewerMemberId);
      pastMembers.set(r.event.id, members);
    }),
  );

  const isEmpty = rows.length === 0;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-12'>
        <section className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            HANAKAI
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            あなたのイベント
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            参加申請から、出会った人とのつながりまで。
            <br className='hidden sm:block' />
            イベント参加の記録がここに集まります。
          </p>
        </section>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className='space-y-12'>
            {pending.length > 0 ? (
              <Section
                kicker='IN REVIEW'
                title='選考中の申請'
                description='運営が参加メンバーを選定しています。結果が出るまでお待ちください。'
              >
                {pending.map((row) => (
                  <StatusRow key={row.event.id} row={row} />
                ))}
              </Section>
            ) : null}

            {upcoming.length > 0 ? (
              <Section
                kicker='UPCOMING'
                title='参加予定のイベント'
                description='参加が確定したイベントです。当日お会いしましょう。'
              >
                {upcoming.map((row) => (
                  <StatusRow key={row.event.id} row={row} />
                ))}
              </Section>
            ) : null}

            {past.length > 0 ? (
              <Section
                kicker='HISTORY'
                title='過去のイベント'
                description='参加したイベントで出会ったメンバーのプロフィールを確認できます。'
              >
                {past.map((row) => (
                  <PastConnectionCard key={row.event.id} row={row} members={pastMembers.get(row.event.id) ?? []} />
                ))}
              </Section>
            ) : null}
          </div>
        )}
      </div>
    </ConnectionShell>
  );
}

function byStartAsc(a: Row, b: Row) {
  return new Date(a.event.startAt).getTime() - new Date(b.event.startAt).getTime();
}

function byStartDesc(a: Row, b: Row) {
  return new Date(b.event.startAt).getTime() - new Date(a.event.startAt).getTime();
}
