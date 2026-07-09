import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { formatEventDate } from '@/lib/connection/data';
import { getEvent } from '@/lib/connection/repo';
import { getApplicationByConfirmationToken, confirmParticipationByToken, declineParticipationByToken } from '@/lib/connection/participation-confirmation';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { revalidatePath } from 'next/cache';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParticipationConfirmPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const token = typeof sp.token === 'string' ? sp.token : '';
  const action = typeof sp.action === 'string' ? sp.action : '';
  const viewer = await getHanakaiViewer();

  if (!token) {
    return (
      <ConnectionShell viewer={viewer}>
        <ResultCard title='リンクが無効です' body='メールのリンクから再度お試しください。' />
      </ConnectionShell>
    );
  }

  const app = await getApplicationByConfirmationToken(token);
  if (!app) {
    return (
      <ConnectionShell viewer={viewer}>
        <ResultCard title='リンクが無効です' body='このリンクは期限切れか、すでに処理済みです。' />
      </ConnectionShell>
    );
  }

  const event = await getEvent(app.eventId);
  if (!event) {
    return (
      <ConnectionShell viewer={viewer}>
        <ResultCard title='イベントが見つかりません' body='お問い合わせください。' />
      </ConnectionShell>
    );
  }

  if (action === 'confirm') {
    const result = await confirmParticipationByToken(token);
    if (result.ok) {
      revalidatePath(`/events/${result.eventId}`);
      revalidatePath('/events');
      redirect(`/events/${result.eventId}?participation=confirmed`);
    }
  }

  if (action === 'decline') {
    const result = await declineParticipationByToken(token);
    if (result.ok) {
      revalidatePath(`/events/${result.eventId}`);
      revalidatePath('/events');
      redirect(`/events/${result.eventId}?participation=declined`);
    }
  }

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-lg space-y-6 rounded-3xl border border-[#ebe9e4] bg-white p-6 shadow-sm sm:p-8'>
        <div className='text-center'>
          <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>参加確認</p>
          <h1 className='mt-3 text-xl font-semibold text-[#1a1a1a]'>あなたの参加イベントが決まりました</h1>
        </div>

        <dl className='space-y-3 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-5 py-4 text-sm'>
          <div>
            <dt className='text-xs text-[#9a9a9a]'>イベント</dt>
            <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{event.title}</dd>
          </div>
          <div>
            <dt className='text-xs text-[#9a9a9a]'>日時</dt>
            <dd className='mt-0.5 font-medium text-[#1a1a1a]'>{formatEventDate(event.startAt)}</dd>
          </div>
          <div>
            <dt className='text-xs text-[#9a9a9a]'>場所</dt>
            <dd className='mt-0.5 font-medium text-[#1a1a1a]'>
              {event.area}
              {event.venue ? ` · ${event.venue}` : ''}
            </dd>
          </div>
        </dl>

        <p className='text-center text-sm leading-7 text-[#6b6b6b]'>
          参加を確定するか、今回は参加しないかを選んでください。
        </p>

        <div className='flex flex-col gap-3'>
          <Link
            href={`/events/participation/confirm?token=${encodeURIComponent(token)}&action=confirm`}
            className='flex h-12 items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            参加を確定する
          </Link>
          <Link
            href={`/events/participation/confirm?token=${encodeURIComponent(token)}&action=decline`}
            className='flex h-12 items-center justify-center rounded-full border border-[#d8d6d1] bg-white text-sm font-semibold text-[#6b6b6b] transition active:scale-[0.98]'
          >
            今回は参加しない
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <div className='mx-auto max-w-lg rounded-3xl border border-[#ebe9e4] bg-white p-8 text-center shadow-sm'>
      <h1 className='text-lg font-semibold text-[#1a1a1a]'>{title}</h1>
      <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>{body}</p>
      <Link
        href='/events'
        className='mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] px-6 text-sm font-semibold text-[#1f5d4f]'
      >
        イベントを見る
      </Link>
    </div>
  );
}
