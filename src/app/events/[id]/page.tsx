import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ApplyWithCardGate } from '@/components/connection/events/apply-with-card-gate';
import { PaymentFailedPanel } from '@/components/connection/payments/payment-failed-panel';
import { CancelParticipationButton } from '@/components/connection/events/cancel-participation-button';
import { EventDetailCta } from '@/components/connection/events/event-detail-cta';
import { EventDetailGallery } from '@/components/connection/events/event-detail-gallery';
import {
  EventFeeCards,
  EventPreDescriptionNotice,
  ParticipationDecidedNotice,
} from '@/components/connection/events/event-fee-ui';
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
import { Chip } from '@/components/connection/ui';
import {
  formatHanakaiUsageFee,
  HANAKAI_USAGE_FEE_LABEL,
} from '@/lib/connection/hanakai-usage-fee';
import { getHanakaiUsageFeeJpy } from '@/lib/connection/hanakai-usage-fee/server';
import { ReportButton } from '@/components/connection/report-button';
import { IdentityRequiredPanel } from '@/components/connection/identity-required-panel';
import { IdentityVerifiedBadge } from '@/components/connection/identity-verified-badge';
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
import { getEventEligibility } from '@/lib/connection/identity-gate';
import {
  listPaymentMethods,
  getApplicationPaymentContext,
} from '@/lib/connection/participation-payment';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
};

function spString(sp: SearchParams, key: string): string {
  const v = sp[key];
  return typeof v === 'string' ? v : '';
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as SearchParams),
  ]);

  // Wave 1: event + independent public/auth lookups in parallel (no payment data).
  // Auth/member reads are request-scoped React.cache — never cross-user shared cache.
  const [event, usageFeeJpy, viewer, viewerMemberId] = await Promise.all([
    getEvent(id),
    getHanakaiUsageFeeJpy(),
    getHanakaiViewer(),
    getViewerMemberId(),
  ]);
  if (!event) notFound();

  // Wave 2: event-dependent public data + viewer-scoped data together.
  // Payment methods / application context stay isolated to this viewer.
  const [confirmedMembers, host, hostBloom, viewerMember, existingApp, paymentMethods] =
    await Promise.all([
      getEventMembers(event.id),
      event.hostId ? getMember(event.hostId) : Promise.resolve(null),
      event.hostId ? getBloomProfile(event.hostId) : Promise.resolve(null),
      viewerMemberId ? getMember(viewerMemberId) : Promise.resolve(null),
      viewerMemberId ? getApplication(event.id, viewerMemberId) : Promise.resolve(null),
      viewerMemberId ? listPaymentMethods(viewerMemberId) : Promise.resolve([]),
    ]);

  const paymentContext =
    viewerMemberId && existingApp
      ? await getApplicationPaymentContext(existingApp.id, viewerMemberId)
      : null;

  const eligibility = getEventEligibility(viewerMember);
  const applied = spString(sp, 'applied') === '1';
  const participationConfirmed = spString(sp, 'participation') === 'confirmed';
  const reasonError = spString(sp, 'error') === 'reason';
  const paymentMethodError = spString(sp, 'error') === 'payment_method';
  const created = spString(sp, 'created') === '1';
  const cancelled = spString(sp, 'cancelled') === '1';
  const cancelError = spString(sp, 'cancel_error');
  const isHost = !!viewerMemberId && event.hostId === viewerMemberId;
  const approvalMode = event.approvalMode ?? 'host_approval';
  const isFull = event.status === 'full' || event.reservedCount >= event.capacity;
  const isParticipationConfirmed = existingApp?.status === 'confirmed';
  const inFlightParticipationStatuses = [
    'pending',
    'payment_processing',
    'payment_failed',
    'awaiting_confirmation',
  ];
  const activeParticipationStatuses = [...inFlightParticipationStatuses, 'confirmed'];
  const showApplyCta =
    !event.isPast &&
    !isHost &&
    !activeParticipationStatuses.includes(existingApp?.status ?? '');
  const participationInFlight = inFlightParticipationStatuses.includes(existingApp?.status ?? '');
  const ctaLabel = '参加する';
  const loginHref = `/login?next=/events/${event.id}`;
  const useScrollCta = !!viewerMemberId;
  const participantCards = anonymizeParticipants(confirmedMembers);
  const isPlaceholderParticipants = confirmedMembers.length === 0;

  return (
    <ConnectionShell viewer={viewer}>
      <article className='mx-auto max-w-3xl space-y-10 lg:max-w-4xl'>
        <EventDetailGallery event={event} />

        {participationConfirmed ? (
          <div className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-5 py-5'>
            <ParticipationDecidedNotice />
          </div>
        ) : null}

        {created ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            イベントを公開しました。
            {typeof sp.checkin_code === 'string' ? (
              <span className='mt-2 block font-semibold'>チェックインコード: {sp.checkin_code}（この画面でのみ表示されます）</span>
            ) : null}
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
            <MetaRow label='定員' value={`${event.reservedCount} / ${event.capacity}名`} />
          </dl>

          <EventFeeCards
            eventFee={event.fee}
            eventFeeType={event.eventFeeType}
            eventFeeAmount={event.eventFeeAmount}
            eventFeeMin={event.eventFeeMin}
            eventFeeMax={event.eventFeeMax}
            eventFeeIncludes={event.eventFeeIncludes}
            eventFeeExcludes={event.eventFeeExcludes}
            eventFeeNotes={event.eventFeeNotes}
          />

          {host ? (
            <div className='flex flex-wrap items-center gap-2'>
              <IdentityVerifiedBadge member={host} />
            </div>
          ) : null}

          {showApplyCta ? (
            <EventDetailCta
              applySectionId='event-apply'
              loginHref={loginHref}
              canApply={useScrollCta}
              label={ctaLabel}
            />
          ) : isParticipationConfirmed ? (
            <div className='space-y-3 rounded-2xl border border-[#1f5d4f]/35 bg-[#eef6f2] px-5 py-5'>
              <p className='text-center text-base font-semibold text-[#1f5d4f]'>参加が決定しました</p>
              <p className='text-center text-sm leading-7 text-[#3f5a50]'>
                {formatEventDate(event.startAt)}
                <br />
                {event.area}
                {event.venue ? `・${event.venue}` : ''}
              </p>
              <p className='text-center text-xs leading-6 text-[#5b6f67]'>
                当日はこの画面からチェックインできます。
              </p>
              {!event.isPast ? (
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Link
                    href={`/events/${event.id}/checkin`}
                    className='inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
                  >
                    チェックインする
                  </Link>
                  <Link
                    href={`/groups/${event.id}`}
                    className='inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
                  >
                    イベントグループを見る
                  </Link>
                </div>
              ) : null}
              {viewerMemberId && !event.isPast ? (
                <CancelParticipationButton eventId={event.id} eventTitle={event.title} returnTo={`/events/${event.id}`} />
              ) : null}
            </div>
          ) : participationInFlight ? (
            <div className='space-y-3 rounded-2xl border border-[#dfe9e4] bg-[#eef4f0] px-5 py-4'>
              <p className='text-center text-sm font-semibold text-[#1f5d4f]'>
                {existingApp?.status === 'pending'
                  ? '参加申請中です'
                  : existingApp?.status === 'payment_processing'
                    ? '決済処理中です'
                    : existingApp?.status === 'payment_failed'
                      ? 'お支払いの確認が必要です'
                      : '参加確認待ちです'}
              </p>
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

        <EventSectionShell kicker='ABOUT' title='イベントについて'>
          <EventPreDescriptionNotice />
          {event.description.trim() ? (
            <p className='mt-4 whitespace-pre-line text-sm leading-8 text-[#4a4a4a]'>{event.description}</p>
          ) : null}
          {event.conditions ? (
            <p className={`${event.description.trim() ? 'mt-3' : 'mt-4'} rounded-xl bg-[#fafaf8] px-4 py-3 text-xs leading-7 text-[#6b6b6b]`}>
              <span className='font-semibold text-[#4a4a4a]'>参加条件: </span>
              {event.conditions}
            </p>
          ) : null}
        </EventSectionShell>

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

        <section id='event-apply' className='scroll-mt-24 space-y-4 pb-28 lg:pb-0'>
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
          ) : existingApp?.status === 'payment_failed' && paymentContext ? (
            <PaymentFailedPanel
              paymentId={paymentContext.paymentId}
              brand={paymentContext.brand}
              last4={paymentContext.last4}
              deadlineAt={paymentContext.deadlineAt}
              failureMessage={paymentContext.failureMessage}
            />
          ) : existingApp?.status === 'payment_processing' ? (
            <div className='rounded-2xl border border-[#dfe9e4] bg-[#faf9f6] px-5 py-5'>
              <p className='inline-flex rounded-full bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-[#1f5d4f]'>
                決済処理中
              </p>
              <p className='mt-3 text-sm leading-7 text-[#4a4a4a]'>
                参加案内をお送りしました。{HANAKAI_USAGE_FEE_LABEL}
                {formatHanakaiUsageFee(usageFeeJpy)}の決済処理中です。完了次第、正式参加として通知します。
              </p>
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
            <div className='rounded-2xl border border-[#1f5d4f]/30 bg-[#eef6f2] px-5 py-5'>
              <p className='text-base font-semibold text-[#1f5d4f]'>参加が決定しました</p>
              <p className='mt-2 text-sm leading-7 text-[#3f5a50]'>
                {formatEventDate(event.startAt)} · {event.area}
                {event.venue ? `・${event.venue}` : ''}
              </p>
              <p className='mt-2 text-xs leading-6 text-[#5b6f67]'>
                当日はこの画面からチェックインできます。参加者同士の交流はイベントグループからどうぞ。
              </p>
              <ParticipationDecidedNotice />
              <Link
                href={`/events/${event.id}/checkin`}
                className='mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
              >
                チェックインする
              </Link>
              <Link
                href={`/groups/${event.id}`}
                className='mt-2 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f]'
              >
                イベントグループを見る
              </Link>
            </div>
          ) : (
            <div className='rounded-2xl border border-[#ebe9e4] bg-white px-5 py-5'>
              {applied || existingApp ? (
                <div className='space-y-2'>
                  {existingApp?.status === 'not_selected' || existingApp?.status === 'rejected' ? (
                    <>
                      <p className='text-sm font-semibold text-[#1a1a1a]'>今回の参加メンバーが決まりました</p>
                      <p className='text-sm leading-7 text-[#4a4a4a]'>
                        お申し込みいただき、ありがとうございました。また別の体験でお会いできることを楽しみにしています。
                      </p>
                    </>
                  ) : existingApp?.status === 'pending' || (applied && approvalMode === 'host_approval') ? (
                    <>
                      <p className='inline-flex rounded-full bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-[#1f5d4f]'>
                        選定待ち
                      </p>
                      <p className='text-sm leading-7 text-[#4a4a4a]'>
                        参加申請を受け付けました。主催者がプロフィール・参加理由を確認し、この体験に合うメンバーを選びます。
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
              ) : viewerMemberId && !eligibility.canApplyToEvents ? (
                <IdentityRequiredPanel laterHref='/my-profile' />
              ) : (
                <>
                  {reasonError ? (
                    <p className='mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
                      参加理由は10文字以上300文字以内で入力してください。
                    </p>
                  ) : null}
                  {paymentMethodError ? (
                    <p className='mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
                      お支払い方法を選択してください。
                    </p>
                  ) : null}
                  <ApplyWithCardGate
                    eventId={event.id}
                    approvalMode={approvalMode}
                    usageFeeJpy={usageFeeJpy}
                    initialMethods={paymentMethods.map((m) => ({
                      id: m.id,
                      brand: m.brand,
                      last4: m.last_4,
                      expMonth: m.exp_month,
                      expYear: m.exp_year,
                      isDefault: m.is_default,
                    }))}
                  />
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
