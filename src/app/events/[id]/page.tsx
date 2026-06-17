import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { Card, Chip } from '@/components/connection/ui';
import { applyConnectionEventAction } from '@/lib/connection/actions';
import {
  EVENT_CATEGORY_LABEL,
  formatEventDate,
  getApplication,
  getEvent,
  getEventMembers,
} from '@/lib/connection/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const MOCK_VIEWER_ID = 'm1';

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const applied = sp.applied === '1';
  const existingApp = getApplication(event.id, MOCK_VIEWER_ID);
  const confirmedMembers = getEventMembers(event.id);
  const isFull = event.status === 'full' || event.reservedCount >= event.capacity;

  return (
    <ConnectionShell viewer={viewer}>
      <article className='space-y-5'>
        <div className='relative h-52 w-full overflow-hidden rounded-2xl'>
          <Image src={event.coverUrl} alt={event.title} fill className='object-cover' priority />
        </div>

        <div className='space-y-2'>
          <Chip tone='accent'>{EVENT_CATEGORY_LABEL[event.category]}</Chip>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
          <p className='text-sm text-[#6b6b6b]'>{event.description}</p>
        </div>

        <Card>
          <dl className='space-y-3 text-sm'>
            <Row label='開催日時'>{formatEventDate(event.startAt)}</Row>
            <Row label='場所'>{event.area} · {event.venue}</Row>
            <Row label='募集人数'>{event.capacity}名</Row>
            <Row label='申込人数'>{event.reservedCount}名</Row>
            <Row label='主催者'>{event.hostName}</Row>
            <Row label='参加条件'>{event.conditions}</Row>
          </dl>
        </Card>

        {confirmedMembers.length > 0 ? (
          <Card>
            <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>確定メンバー {confirmedMembers.length}名</h2>
            <div className='flex flex-wrap gap-2'>
              {confirmedMembers.map((m) => (
                <span key={m.id} className='rounded-full bg-[#f0eeea] px-3 py-1 text-xs text-[#4a4a4a]'>{m.nickname}</span>
              ))}
            </div>
          </Card>
        ) : null}

        {event.isPast ? (
          <Card className='bg-[#f5f4f2]'>
            <p className='text-sm text-[#4a4a4a]'>このイベントは終了しました。</p>
            <a href={`/connections/${event.id}`} className='mt-2 inline-block text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
              Connectionページを見る →
            </a>
          </Card>
        ) : (
          <>
            {applied || existingApp ? (
              <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-sm text-[#4a4a4a]'>
                参加申請を受け付けました。運営が6名を選定します。
              </p>
            ) : null}

            <form action={applyConnectionEventAction}>
              <input type='hidden' name='eventId' value={event.id} />
              <button
                type='submit'
                disabled={isFull || Boolean(existingApp)}
                className='h-12 w-full rounded-full bg-[#1a1a1a] text-sm font-semibold text-white disabled:opacity-40'
              >
                {existingApp ? '申請済み' : isFull ? '満席です' : '参加申請する'}
              </button>
            </form>
          </>
        )}
      </article>
    </ConnectionShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex justify-between gap-4'>
      <dt className='shrink-0 text-xs text-[#9a9a9a]'>{label}</dt>
      <dd className='text-right text-[#1a1a1a]'>{children}</dd>
    </div>
  );
}
