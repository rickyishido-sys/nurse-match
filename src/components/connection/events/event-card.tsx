import Image from 'next/image';
import Link from 'next/link';
import { EVENT_CATEGORY_DEFAULT_IMAGE, EVENT_CATEGORY_META, formatEventDate } from '@/lib/connection/data';
import type { ConnectionEvent } from '@/lib/connection/types';

function statusLabel(status: string) {
  if (status === 'full') return '満席';
  if (status === 'almost_full') return '残りわずか';
  if (status === 'completed') return '終了';
  return '受付中';
}

export function formatFee(fee?: number) {
  if (!fee || fee <= 0) return '無料';
  return `¥${fee.toLocaleString('ja-JP')}`;
}

export function EventCard({ event }: { event: ConnectionEvent }) {
  const meta = EVENT_CATEGORY_META[event.category];
  const uploaded = event.imageUrls?.[0];
  const categoryImage = EVENT_CATEGORY_DEFAULT_IMAGE[event.category];
  const heroSrc = uploaded || event.coverUrl || categoryImage || null;

  return (
    <Link
      href={`/events/${event.id}`}
      className='block overflow-hidden rounded-3xl border border-[#ebe9e4] bg-white shadow-[0_2px_12px_rgba(26,26,26,0.04)] transition active:scale-[0.99]'
    >
      <div className={`relative h-44 w-full bg-gradient-to-br ${meta.gradient}`}>
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={event.title}
            fill
            className={uploaded || event.coverUrl ? 'object-cover' : 'object-contain p-6 mix-blend-multiply'}
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center text-5xl opacity-70' aria-hidden>
            {meta.emoji}
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent' />
        <div className='absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] backdrop-blur'>
          <span>{meta.emoji}</span>
          {meta.short}
        </div>
        <div className='absolute right-3 top-3 flex items-center gap-1.5'>
          {event.isUserCreated ? (
            <span className='rounded-full bg-[#1f5d4f]/90 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur'>
              ユーザー主催
            </span>
          ) : null}
          <span className='rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur'>
            {statusLabel(event.status)}
          </span>
        </div>
        <div className='absolute bottom-3 left-3 right-3'>
          <p className='text-sm font-semibold text-white drop-shadow'>{event.title}</p>
          <p className='mt-0.5 text-[11px] text-white/85'>{meta.tagline}</p>
        </div>
      </div>
      <div className='space-y-1.5 p-4'>
        <p className='text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)}</p>
        <p className='text-xs text-[#6b6b6b]'>
          {event.area} · {event.venue}
        </p>
        <div className='flex items-center justify-between pt-0.5 text-xs text-[#6b6b6b]'>
          <span>主催 · {event.hostName}</span>
          <span className='font-medium text-[#1a1a1a]'>{formatFee(event.fee)}</span>
        </div>
        <div className='flex items-center justify-between pt-1'>
          <span className='text-xs text-[#9a9a9a]'>
            定員{event.capacity}名 · {event.reservedCount}名申込
          </span>
          <span className='text-xs font-semibold' style={{ color: meta.accent }}>
            詳細を見る →
          </span>
        </div>
      </div>
    </Link>
  );
}
