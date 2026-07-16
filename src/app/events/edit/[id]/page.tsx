import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { IdentityRequiredPanel } from '@/components/connection/identity-required-panel';
import { EditEventForm } from '@/components/connection/events/edit-event-form';
import { canEditEvent } from '@/lib/connection/event-management';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getEventEligibility } from '@/lib/connection/identity-gate';
import { getEvent, getMember } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: 'イベント編集',
  robots: { index: false, follow: false },
};

export default async function EditEventPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  if (!viewerMemberId) redirect(`/login?next=/events/edit/${id}`);
  if (!(await canEditEvent(id, viewerMemberId))) notFound();

  const hostMember = await getMember(viewerMemberId);
  const eligibility = getEventEligibility(hostMember);
  if (!eligibility.isVerified) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='mx-auto max-w-xl space-y-4'>
          <Link href={`/events/${id}`} className='text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>← イベント詳細</Link>
          <IdentityRequiredPanel laterHref='/my-profile' />
        </div>
      </ConnectionShell>
    );
  }

  const error = typeof sp.error === 'string' ? sp.error : undefined;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-xl space-y-4'>
        <div>
          <Link href={`/events/${id}`} className='text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>← イベント詳細</Link>
          <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>イベントを編集</h1>
        </div>
        <EditEventForm
          event={{
            id: event.id,
            title: event.title,
            category: event.category,
            description: event.description,
            startAt: event.startAt,
            area: event.area,
            venue: event.venue,
            capacity: event.capacity,
            fee: event.fee ?? 0,
            conditions: event.conditions,
            approvalMode: event.approvalMode ?? 'host_approval',
            recruitmentType: event.recruitmentType ?? 'standard',
            status: event.status,
            imageUrls: event.imageUrls ?? [],
          }}
          error={error}
        />
      </div>
    </ConnectionShell>
  );
}
