import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { HostBadgeList } from '@/components/connection/host-badge';
import { ApplyForm } from '@/components/connection/events/apply-form';
import { formatFee } from '@/components/connection/events/event-card';
import { EventGallery } from '@/components/connection/events/event-gallery';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { Card, Chip } from '@/components/connection/ui';
import { EVENT_CATEGORY_LABEL, formatEventDate } from '@/lib/connection/data';
import { getApplication, getEvent, getEventMembers, getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const applied = sp.applied === '1';
  const reasonError = sp.error === 'reason';
  const created = sp.created === '1';
  const existingApp = viewerMemberId ? await getApplication(event.id, viewerMemberId) : null;
  const confirmedMembers = await getEventMembers(event.id);
  const host = event.hostId ? await getMember(event.hostId) : null;
  const isHost = !!viewerMemberId && event.hostId === viewerMemberId;
  const approvalMode = event.approvalMode ?? 'host_approval';
  const isFull = event.status === 'full' || event.reservedCount >= event.capacity;

  return (
    <ConnectionShell viewer={viewer}>
      <article className='space-y-5'>
        <EventGallery event={event} />

        {created ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            イベントを公開しました。参加申請が届いたら、管理画面から承認できます。
          </p>
        ) : null}

        <div className='space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Chip tone='accent'>{EVENT_CATEGORY_LABEL[event.category]}</Chip>
            {event.isUserCreated ? <Chip tone='muted'>ユーザー主催</Chip> : null}
            <Chip tone='muted'>{approvalMode === 'auto' ? '自動承認' : '主催者承認制'}</Chip>
          </div>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
          <p className='whitespace-pre-line text-sm leading-7 text-[#6b6b6b]'>{event.description}</p>
        </div>

        <Card>
          <dl className='space-y-3 text-sm'>
            <Row label='開催日時'>{formatEventDate(event.startAt)}</Row>
            <Row label='場所'>{event.area}{event.venue ? ` · ${event.venue}` : ''}</Row>
            <Row label='定員'>{event.capacity}名</Row>
            <Row label='参加予定'>{event.reservedCount}名</Row>
            <Row label='参加費'>{formatFee(event.fee)}</Row>
            {event.conditions ? <Row label='参加条件'>{event.conditions}</Row> : null}
          </dl>
        </Card>

        <Card>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>主催者</h2>
          <div className='flex items-start gap-3'>
            {host ? (
              <MemberAvatar member={host} size={48} />
            ) : (
              <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0eeea] text-lg' aria-hidden>
                ✿
              </span>
            )}
            <div className='space-y-1.5'>
              <p className='text-sm font-medium text-[#1a1a1a]'>{event.hostName}</p>
              {host ? <p className='text-xs text-[#6b6b6b]'>{host.occupation} · {host.area}</p> : null}
              {host ? <HostBadgeList badges={host.hostBadges} /> : null}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>
            参加予定者 {confirmedMembers.length}名 <span className='font-normal text-[#9a9a9a]'>/ 定員{event.capacity}名</span>
          </h2>
          {confirmedMembers.length > 0 ? (
            <div className='space-y-3'>
              {confirmedMembers.map((m) => (
                <div key={m.id} className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <MemberAvatar member={m} size={40} />
                    <div>
                      <p className='text-sm font-medium text-[#1a1a1a]'>{m.nickname}</p>
                      <p className='text-[11px] text-[#6b6b6b]'>{m.occupation}</p>
                    </div>
                  </div>
                  <TrustBadgeList member={m} />
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-[#9a9a9a]'>まだ参加者は確定していません。最初のひとりになりませんか。</p>
          )}
        </Card>

        {event.isPast ? (
          <Card className='bg-[#f5f4f2]'>
            <p className='text-sm text-[#4a4a4a]'>このイベントは終了しました。</p>
            <div className='mt-3 flex flex-col gap-2'>
              <Link href={`/connections/${event.id}`} className='text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
                Connectionページを見る →
              </Link>
              {(existingApp?.status === 'confirmed' || isHost) && viewerMemberId ? (
                <Link href={`/groups/${event.id}`} className='text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
                  参加者グループを見る →
                </Link>
              ) : null}
            </div>
          </Card>
        ) : isHost ? (
          <Card className='border-[#cfe3da] bg-[#f3f7f5]'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>あなたが主催するイベントです</p>
            <p className='mt-1 text-xs leading-6 text-[#5b6f67]'>
              申請者の参加理由を読み、参加する方を選びましょう。
            </p>
            <div className='mt-3 space-y-2'>
              <Link
                href={`/events/manage/${event.id}`}
                className='inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
              >
                申請者を管理する
              </Link>
              <Link
                href={`/groups/${event.id}`}
                className='inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
              >
                参加者グループを開く
              </Link>
            </div>
          </Card>
        ) : existingApp?.status === 'confirmed' ? (
          <Card className='border-[#dfe9e4] bg-[#faf9f6]'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>参加が確定しました</p>
            <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
              参加者同士で感想や写真を共有できます。
            </p>
            <Link
              href={`/groups/${event.id}`}
              className='mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
            >
              グループを開く
            </Link>
          </Card>
        ) : (
          <Card>
            {applied || existingApp ? (
              <div className='space-y-2'>
                {existingApp?.status === 'rejected' ? (
                  <>
                    <p className='text-sm font-semibold text-[#1a1a1a]'>却下されました</p>
                    <p className='text-sm leading-7 text-[#4a4a4a]'>
                      今回はご縁がありませんでしたが、ほかのConnectionでお会いできますように。
                    </p>
                  </>
                ) : existingApp?.status === 'pending' || (applied && approvalMode === 'host_approval') ? (
                  <>
                    <p className='inline-flex rounded-full bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-[#1f5d4f]'>
                      承認待ち
                    </p>
                    <p className='text-sm leading-7 text-[#4a4a4a]'>
                      参加申請を受け付けました。主催者が参加理由を読んで参加者を選びます。
                    </p>
                  </>
                ) : (
                  <>
                    <p className='inline-flex rounded-full bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-[#1f5d4f]'>
                      申請済み
                    </p>
                    <p className='text-sm leading-7 text-[#4a4a4a]'>
                      参加を受け付けました。当日お会いできるのを楽しみにしています。
                    </p>
                  </>
                )}
              </div>
            ) : isFull ? (
              <p className='text-sm text-[#9a9a9a]'>このイベントは満席です。</p>
            ) : (
              <>
                {reasonError ? (
                  <p className='mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
                    参加理由は10文字以上300文字以内で入力してください。
                  </p>
                ) : null}
                <p className='mb-3 text-sm leading-7 text-[#6b6b6b]'>
                  {approvalMode === 'auto'
                    ? 'あなたの想いを添えて参加できます。'
                    : 'あなたの想いを添えて申請してください。主催者が読んで参加者を選びます。'}
                </p>
                <ApplyForm eventId={event.id} approvalMode={approvalMode} />
              </>
            )}
          </Card>
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
