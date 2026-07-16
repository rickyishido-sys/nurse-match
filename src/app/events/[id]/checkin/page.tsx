import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { CheckinCodeForm } from '@/components/connection/events/checkin-code-form';
import { Card } from '@/components/connection/ui';
import { getMemberCheckin } from '@/lib/connection/event-operations/repo';
import { getApplication, getEvent } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventCheckinPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  if (!viewerMemberId) {
    redirect(`/login?next=/events/${id}/checkin`);
  }

  const isHost = event.hostId === viewerMemberId;
  const app = await getApplication(id, viewerMemberId);
  if (!isHost && app?.status !== 'confirmed') {
    return (
      <ConnectionShell viewer={viewer}>
        <Card className='text-center'>
          <p className='text-sm font-semibold text-[#1a1a1a]'>チェックインは参加確定者のみ可能です</p>
          <Link href={`/events/${id}`} className='mt-4 inline-block text-xs text-[#1f5d4f] underline-offset-2 hover:underline'>
            イベント詳細へ戻る
          </Link>
        </Card>
      </ConnectionShell>
    );
  }

  const existing = await getMemberCheckin(id, viewerMemberId);
  const done = sp.done === '1' || !!existing;
  const error = typeof sp.error === 'string' ? sp.error : null;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-lg space-y-6'>
        <Link href={`/events/${id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
          ← イベント詳細へ
        </Link>
        <div>
          <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>CHECK-IN</p>
          <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>チェックイン</h1>
          <p className='mt-1 text-sm text-[#6b6b6b]'>{event.title}</p>
        </div>
        <CheckinCodeForm eventId={id} eventTitle={event.title} alreadyCheckedIn={done} error={error} />
      </div>
    </ConnectionShell>
  );
}
