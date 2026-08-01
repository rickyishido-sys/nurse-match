import Image from 'next/image';
import Link from 'next/link';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { IdentityVerifiedBadge } from '@/components/connection/identity-verified-badge';
import { formatEventParticipationFee } from '@/lib/connection/participation-fee';
import { EVENT_CATEGORY_DEFAULT_IMAGE, EVENT_CATEGORY_META, formatEventDate } from '@/lib/connection/data';
import type { EnrichedEventListItem } from '@/lib/connection/events-list-data';

function TrustIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full border border-[#e7e2d8] bg-[#faf9f6] px-2.5 py-1 text-[10px] font-medium text-[#4a4a4a]'>
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}

function ParticipationMeter({ joined, remaining, capacity }: { joined: number; remaining: number; capacity: number }) {
  const ratio = capacity > 0 ? Math.min(1, joined / capacity) : 0;
  return (
    <div className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3'>
      <div className='flex items-baseline justify-between gap-2'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>
          現在<span className='text-[#1f5d4f]'>{joined}</span>名が参加予定
        </p>
        {remaining > 0 ? (
          <p className='text-xs font-medium text-[#b8956a]'>残り{remaining}席</p>
        ) : (
          <p className='text-xs font-medium text-rose-600'>満席</p>
        )}
      </div>
      <div className='mt-2.5 h-2 overflow-hidden rounded-full bg-[#ebe9e4]'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-[#1f5d4f] to-[#3d8a74] transition-all'
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className='mt-2 text-[10px] text-[#9a9a9a]'>定員{capacity}名</p>
    </div>
  );
}

export function EventsListCard({
  item,
  variant = 'standard',
}: {
  item: EnrichedEventListItem;
  variant?: 'standard' | 'additional';
}) {
  const { event, host, catchCopy, hostTagline, hostVerified, experienceLine, participantChips, participantIsPlaceholder, joinedCount, remainingSeats, isSmallGroup, viewerApplicationStatus } = item;
  const meta = EVENT_CATEGORY_META[event.category];
  const uploaded = event.imageUrls?.[0];
  const categoryImage = EVENT_CATEGORY_DEFAULT_IMAGE[event.category];
  const heroSrc = uploaded || event.coverUrl || categoryImage || null;
  const detailHref = `/events/${event.id}`;
  const applyHref = `${detailHref}#event-apply`;
  const hasParticipation = viewerApplicationStatus && ['pending', 'awaiting_confirmation', 'confirmed'].includes(viewerApplicationStatus);

  return (
    <article className={`hk-brand-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-white/90 shadow-[0_8px_40px_rgba(26,26,26,0.07)] backdrop-blur-sm transition duration-500 hover:shadow-[0_20px_50px_rgba(31,93,79,0.12)] ${
      variant === 'additional' ? 'border-[#e8a0a8]/50' : 'border-white/80'
    }`}>
      <Link href={detailHref} className='group block flex-1'>
        <div className={`relative aspect-[5/3] w-full bg-gradient-to-br ${meta.gradient}`}>
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt={event.title}
              fill
              sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
              className={
                uploaded || event.coverUrl
                  ? 'object-cover transition duration-500 group-hover:scale-[1.02]'
                  : 'object-contain p-8 mix-blend-multiply'
              }
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center text-6xl opacity-60' aria-hidden>
              {meta.emoji}
            </div>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent' />
          <div className='absolute left-4 top-4 flex flex-wrap gap-1.5'>
            <span className='rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] backdrop-blur'>
              {meta.emoji} {meta.short}
            </span>
            <span className='rounded-full bg-[#1f5d4f]/90 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur'>
              初参加歓迎
            </span>
            {isSmallGroup ? (
              <span className='rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur'>
                少人数開催
              </span>
            ) : null}
          </div>
          <div className='absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10'>
            <h2 className='text-lg font-semibold leading-snug text-white drop-shadow sm:text-xl'>{event.title}</h2>
            <p className='mt-1 text-xs leading-6 text-white/90'>{catchCopy}</p>
          </div>
        </div>

        <div className='space-y-4 px-5 py-5'>
          <p className='text-sm leading-7 text-[#4a4a4a]'>{experienceLine}</p>

          <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#6b6b6b]'>
            <div>
              <dt className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>日時</dt>
              <dd className='mt-0.5 font-medium text-[#1a1a1a]'>{formatEventDate(event.startAt)}</dd>
            </div>
            <div>
              <dt className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>イベント参加費</dt>
              <dd className='mt-0.5 font-medium text-[#1a1a1a]'>{formatEventParticipationFee(event.fee)}</dd>
            </div>
            <div className='col-span-2'>
              <dt className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>場所</dt>
              <dd className='mt-0.5 font-medium text-[#1a1a1a]'>
                {event.area}
                {event.venue ? ` · ${event.venue}` : ''}
              </dd>
            </div>
          </dl>

          <ParticipationMeter joined={joinedCount} remaining={remainingSeats} capacity={event.capacity} />

          <div className='flex flex-wrap gap-1.5'>
            {hostVerified && host ? <IdentityVerifiedBadge member={host} /> : null}
            <TrustIcon icon='🚩' label='通報機能あり' />
            {isSmallGroup ? <TrustIcon icon='👥' label='少人数開催' /> : null}
          </div>

          <div className='rounded-2xl border border-[#ebe9e4] bg-gradient-to-br from-[#f8faf8] to-[#faf7f2] px-4 py-4'>
            <p className='text-[10px] font-semibold tracking-wide text-[#9a9a9a]'>主催者</p>
            <div className='mt-3 flex items-start gap-3'>
              {host ? (
                <MemberAvatar member={host} size={48} className='shrink-0' />
              ) : (
                <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-lg' aria-hidden>
                  ✿
                </span>
              )}
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-sm font-semibold text-[#1a1a1a]'>{event.hostName}</p>
                  {host ? <IdentityVerifiedBadge member={host} /> : null}
                </div>
                <p className='mt-1.5 line-clamp-2 text-xs leading-6 text-[#6b6b6b]'>{hostTagline}</p>
              </div>
            </div>
          </div>

          <div>
            <p className='mb-2 text-[10px] font-semibold tracking-wide text-[#9a9a9a]'>参加予定者のイメージ</p>
            {participantIsPlaceholder ? (
              <p className='mb-2 text-[10px] text-[#9a9a9a]'>※ 個人情報は表示しません</p>
            ) : null}
            <div className='flex flex-wrap gap-1.5'>
              {participantChips.map((chip) => (
                <span
                  key={chip}
                  className='rounded-full border border-[#e7e2d8] bg-[#fbf9f5] px-2.5 py-1 text-[11px] font-medium text-[#4a4a4a]'
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>

      <div className='mt-auto flex flex-col gap-2.5 border-t border-[#f1efe9] px-5 py-4 sm:flex-row sm:items-stretch sm:gap-3'>
        <Link
          href={detailHref}
          className='inline-flex h-11 min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#d8d6d1] bg-white px-6 text-sm font-semibold text-[#4a4a4a] transition hover:border-[#1f5d4f]/35 hover:bg-[#f7faf8] active:scale-[0.98] sm:min-w-0 sm:flex-1'
        >
          詳しく見る
        </Link>
        {hasParticipation ? (
          <span className='inline-flex h-11 min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#1f5d4f]/25 bg-[#eef4f0] px-6 text-sm font-semibold text-[#1f5d4f] sm:min-w-0 sm:flex-1'>
            参加予定です
          </span>
        ) : (
          <Link
            href={applyHref}
            className='inline-flex h-11 min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition hover:bg-[#1a4f44] active:scale-[0.98] sm:min-w-0 sm:flex-1'
          >
            参加する
          </Link>
        )}
      </div>
    </article>
  );
}
