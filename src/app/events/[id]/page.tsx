import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ApplyForm } from '@/components/connection/events/apply-form';
import { CancelParticipationButton } from '@/components/connection/events/cancel-participation-button';
import { EventDetailCta } from '@/components/connection/events/event-detail-cta';
import { EventDetailGallery } from '@/components/connection/events/event-detail-gallery';
import {
  EventBloomAfterCard,
  EventBloomIntroCard,
  EventDayTimeline,
  EventHostSection,
  EventParticipantPreview,
  EventRecommendedCards,
  EventSafetyStrip,
  EventSectionShell,
} from '@/components/connection/events/event-detail-sections';
import { formatFee } from '@/components/connection/events/event-card';
import { ReportButton } from '@/components/connection/report-button';
import { Chip } from '@/components/connection/ui';
import { getBloomProfile } from '@/lib/connection/bloom-profile';
import { EVENT_CATEGORY_LABEL, formatEventDate } from '@/lib/connection/data';
import {
  anonymizeParticipants,
  buildEventTimeline,
  getExperienceTagline,
  getRecommendedFor,
} from '@/lib/connection/event-detail-ux';
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
  const cancelled = sp.cancelled === '1';
  const cancelError = typeof sp.cancel_error === 'string' ? sp.cancel_error : '';
  const existingApp = viewerMemberId ? await getApplication(event.id, viewerMemberId) : null;
  const confirmedMembers = await getEventMembers(event.id);
  const host = event.hostId ? await getMember(event.hostId) : null;
  const hostBloom = event.hostId ? await getBloomProfile(event.hostId) : null;
  const isHost = !!viewerMemberId && event.hostId === viewerMemberId;
  const approvalMode = event.approvalMode ?? 'host_approval';
  const isFull = event.status === 'full' || event.reservedCount >= event.capacity;
  const showApplyCta = !event.isPast && !isHost && !['confirmed', 'pending', 'awaiting_confirmation'].includes(existingApp?.status ?? '');
  const participationScheduled = ['pending', 'awaiting_confirmation', 'confirmed'].includes(existingApp?.status ?? '');
  const ctaLabel = participationScheduled ? '参加予定です' : '参加する';
  const loginHref = `/login?next=/events/${event.id}`;
  const useScrollCta = !!viewerMemberId;
  const participantCards = anonymizeParticipants(confirmedMembers);
  const isPlaceholderParticipants = confirmedMembers.length === 0;

  return (
    <ConnectionShell viewer={viewer}>
      <article className='mx-auto max-w-3xl space-y-10 lg:max-w-4xl'>
        <EventDetailGallery event={event} />

        {created ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            イベントを公開しました。参加申請が届いたら、管理画面から承認できます。
          </p>
        ) : null}
        {cancelled ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-sm text-[#4a4a4a]'>
            参加をキャンセルしました。
          </p>
        ) : null}
        {cancelError ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            キャンセルできませんでした。イベント開始後の場合はお問い合わせください。
          </p>
        ) : null}

        <header className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Chip tone='accent'>{EVENT_CATEGORY_LABEL[event.category]}</Chip>
            {event.isUserCreated ? <Chip tone='muted'>ユーザー主催</Chip> : null}
            <Chip tone='muted'>{approvalMode === 'auto' ? '自動承認' : '主催者承認制'}</Chip>
            {event.capacity <= 8 ? <Chip tone='muted'>少人数</Chip> : null}
          </div>

          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 space-y-3'>
              <h1 className='text-2xl font-semibold leading-tight tracking-tight text-[#1a1a1a] sm:text-[1.75rem] lg:text-3xl'>
                {event.title}
              </h1>
              <p className='text-sm leading-8 text-[#4a4a4a] sm:text-base'>
                {getExperienceTagline(event)}
              </p>
            </div>
            <ReportButton
              target={{
                targetType: 'event',
                targetEventId: event.id,
                label: `イベント「${event.title}」`,
              }}
              canReport={!!viewerMemberId}
              loginNext={`/events/${event.id}`}
            />
          </div>

          <dl className='grid gap-2 rounded-2xl border border-[#ebe9e4] bg-white px-4 py-4 text-sm sm:grid-cols-2 sm:gap-x-6'>
            <MetaRow label='開催日時' value={formatEventDate(event.startAt)} />
            <MetaRow label='場所' value={`${event.area}${event.venue ? ` · ${event.venue}` : ''}`} />
            <MetaRow label='参加費' value={formatFee(event.fee)} />
            <MetaRow label='定員' value={`${event.reservedCount} / ${event.capacity}名`} />
          </dl>

          {showApplyCta ? (
            <EventDetailCta
              applySectionId='event-apply'
              loginHref={loginHref}
              canApply={useScrollCta}
              label={ctaLabel}
            />
          ) : participationScheduled ? (
            <div className='space-y-3 rounded-2xl border border-[#dfe9e4] bg-[#eef4f0] px-5 py-4'>
              <p className='text-center text-sm font-semibold text-[#1f5d4f]'>参加予定です</p>
              {viewerMemberId && !event.isPast ? (
                <CancelParticipationButton eventId={event.id} eventTitle={event.title} returnTo={`/events/${event.id}`} />
              ) : null}
            </div>
          ) : null}
        </header>

        <EventSectionShell kicker='SCHEDULE' title='当日の流れ'>
          <EventDayTimeline steps={buildEventTimeline(event.startAt)} />
        </EventSectionShell>

        <EventSectionShell kicker='FOR YOU' title='こんな方におすすめ'>
          <EventRecommendedCards items={getRecommendedFor(event)} />
        </EventSectionShell>

        {event.description.trim() ? (
          <EventSectionShell kicker='ABOUT' title='イベントについて'>
            <p className='whitespace-pre-line text-sm leading-8 text-[#4a4a4a]'>{event.description}</p>
            {event.conditions ? (
              <p className='mt-3 rounded-xl bg-[#fafaf8] px-4 py-3 text-xs leading-7 text-[#6b6b6b]'>
                <span className='font-semibold text-[#4a4a4a]'>参加条件: </span>
                {event.conditions}
              </p>
            ) : null}
          </EventSectionShell>
        ) : null}

        <EventSectionShell kicker='COMMUNITY' title='参加予定者のイメージ'>
          <EventParticipantPreview cards={participantCards} isPlaceholder={isPlaceholderParticipants} />
        </EventSectionShell>

        <EventSectionShell kicker='HOST' title='主催者について'>
          <EventHostSection
            host={host}
            hostName={event.hostName}
            bloomProfile={hostBloom}
            eventId={event.id}
            viewerMemberId={viewerMemberId}
          />
        </EventSectionShell>

        <EventBloomAfterCard />
        <EventBloomIntroCard />
        <EventSafetyStrip />

        <section id='event-apply' className='scroll-mt-24 space-y-4'>
          <h2 className='text-lg font-semibold text-[#1a1a1a]'>参加する</h2>

          {event.isPast ? (
            <div className='rounded-2xl border border-[#ebe9e4] bg-[#f5f4f2] px-5 py-5'>
              <p className='text-sm text-[#4a4a4a]'>このイベントは終了しました。</p>
              <div className='mt-3 flex flex-col gap-2'>
                <Link href={`/connections/${event.id}`} className='text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
                  イベントの記録を見る →
                </Link>
                {(existingApp?.status === 'confirmed' || isHost) && viewerMemberId ? (
                  <Link href={`/groups/${event.id}`} className='text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
                    参加者グループを見る →
                  </Link>
                ) : null}
              </div>
            </div>
          ) : isHost ? (
            <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-5 py-5'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>あなたが主催するイベントです</p>
              <p className='mt-1 text-xs leading-6 text-[#5b6f67]'>
                申請者の参加理由を読み、参加する方を選びましょう。
              </p>
              <div className='mt-4 space-y-2'>
                <Link
                  href={`/events/manage/${event.id}`}
                  className='inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
                >
                  申請者を管理する
                </Link>
                <Link
                  href={`/events/edit/${event.id}`}
                  className='inline-flex h-11 w-full items-center justify-center rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b]'
                >
                  イベントを編集
                </Link>
                <Link
                  href={`/groups/${event.id}`}
                  className='inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
                >
                  参加者グループを開く
                </Link>
              </div>
            </div>
          ) : existingApp?.status === 'awaiting_confirmation' ? (
            <div className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-5 py-5'>
              <p className='inline-flex rounded-full bg-[#fff4e6] px-3 py-1 text-xs font-semibold text-[#b8956a]'>
                参加確認待ち
              </p>
              <p className='mt-3 text-sm leading-7 text-[#4a4a4a]'>
                あなたの参加イベントが決まりました。メールのリンクから参加を確定してください。
              </p>
              {existingApp.confirmationToken ? (
                <Link
                  href={`/events/participation/confirm?token=${encodeURIComponent(existingApp.confirmationToken)}`}
                  className='mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
                >
                  参加を確定する
                </Link>
              ) : null}
            </div>
          ) : existingApp?.status === 'confirmed' ? (
            <div className='rounded-2xl border border-[#dfe9e4] bg-[#faf9f6] px-5 py-5'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>参加が確定しました</p>
              <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
                当日お会いできるのを楽しみにしています。参加者同士で感想や写真を共有できます。
              </p>
              <Link
                href={`/groups/${event.id}`}
                className='mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
              >
                グループを開く
              </Link>
            </div>
          ) : (
            <div className='rounded-2xl border border-[#ebe9e4] bg-white px-5 py-5'>
              {applied || existingApp ? (
                <div className='space-y-2'>
                  {existingApp?.status === 'rejected' ? (
                    <>
                      <p className='text-sm font-semibold text-[#1a1a1a]'>却下されました</p>
                      <p className='text-sm leading-7 text-[#4a4a4a]'>
                        今回はご縁がありませんでしたが、ほかのイベントでお会いできますように。
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
                  <p className='mb-4 text-sm leading-7 text-[#6b6b6b]'>
                    {approvalMode === 'auto'
                      ? 'あなたの想いを添えて参加できます。主催者と参加者が、心地よいConnectionを育てます。'
                      : 'あなたの想いを添えて申請してください。主催者が読んで、参加者を選びます。'}
                  </p>
                  <ApplyForm eventId={event.id} approvalMode={approvalMode} />
                </>
              )}
            </div>
          )}
        </section>

        {showApplyCta ? (
          <EventDetailCta
            applySectionId='event-apply'
            loginHref={loginHref}
            canApply={useScrollCta}
            label={ctaLabel}
            variant='sticky'
          />
        ) : null}
      </article>
    </ConnectionShell>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between gap-3 sm:block'>
      <dt className='text-xs text-[#9a9a9a]'>{label}</dt>
      <dd className='text-right font-medium text-[#1a1a1a] sm:mt-0.5 sm:text-left'>{value}</dd>
    </div>
  );
}
