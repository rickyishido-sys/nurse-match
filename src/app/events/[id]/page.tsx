import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { applyEventAction } from '@/lib/hanakai/actions';
import { formatEventDate, formatYen, getEvent, getUser, listEventParticipants } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const host = getUser(event.hostId);
  const participants = listEventParticipants(event.id);
  const isFull = event.status === 'full' || event.reservedCount >= event.capacity;
  const applied = sp.applied === '1';

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <div className='relative h-48 w-full overflow-hidden rounded-3xl'>
          <Image src={event.coverUrl} alt={event.title} fill className='object-cover' priority />
        </div>

        <div className='space-y-1'>
          <h1 className='text-lg font-bold text-slate-800'>{event.title}</h1>
          <p className='text-sm text-slate-500'>{formatEventDate(event.startAt)}</p>
        </div>

        <Card>
          <dl className='space-y-2 text-sm'>
            <Row label='場所'>{event.area}・{event.venue}</Row>
            <Row label='定員'>{event.reservedCount} / {event.capacity}名 {isFull ? <Chip tone='gray'>満席</Chip> : null}</Row>
            <Row label='参加費'>{formatYen(event.fee)}</Row>
            <Row label='講師'>{host ? <Link href={`/members/${host.id}`} className='text-[#4f7a4a]'>{host.nickname}先生</Link> : '未定'}</Row>
            <Row label='お酒'>{event.hasAlcohol ? 'あり' : 'なし'}</Row>
          </dl>
        </Card>

        <Card>
          <h2 className='mb-1 text-sm font-bold text-slate-800'>内容</h2>
          <p className='text-sm leading-7 text-slate-600'>{event.description}</p>
        </Card>

        <Card>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>参加者 {participants.length}名</h2>
          <div className='flex flex-wrap gap-3'>
            {participants.map((p) => (
              <Link key={p.id} href={`/members/${p.id}`} className='text-center'>
                <div className='relative h-12 w-12 overflow-hidden rounded-full'>
                  <Image src={p.avatarUrl} alt={p.nickname} fill className='object-cover' />
                </div>
                <p className='mt-1 max-w-[3rem] truncate text-[10px] text-slate-500'>{p.nickname}</p>
              </Link>
            ))}
          </div>
        </Card>

        {applied ? (
          <p className='rounded-2xl bg-[#eef4ea] px-3 py-2 text-sm text-[#4f7a4a]'>参加申込を受け付けました。当日お会いしましょう。</p>
        ) : null}

        <form action={applyEventAction}>
          <input type='hidden' name='eventId' value={event.id} />
          <button
            disabled={isFull}
            className={`h-12 w-full rounded-2xl text-sm font-bold ${isFull ? 'bg-slate-200 text-slate-400' : 'bg-[#4f7a4a] text-white'}`}
          >
            {isFull ? '満席です' : 'この花会に申し込む'}
          </button>
        </form>
      </article>
    </HanakaiShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <dt className='text-xs text-slate-400'>{label}</dt>
      <dd className='flex items-center gap-2 text-right text-slate-700'>{children}</dd>
    </div>
  );
}
