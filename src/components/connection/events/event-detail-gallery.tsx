'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { EVENT_CATEGORY_DEFAULT_IMAGE, EVENT_CATEGORY_META } from '@/lib/connection/data';
import { getGalleryImages } from '@/lib/connection/event-detail-ux';
import type { ConnectionEvent } from '@/lib/connection/types';

export function EventDetailGallery({ event }: { event: ConnectionEvent }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const meta = EVENT_CATEGORY_META[event.category];
  const images = getGalleryImages(event);
  const hasUploads = (event.imageUrls ?? []).filter(Boolean).length > 0;

  return (
    <section className='-mx-5 lg:-mx-10'>
      <div
        ref={scrollRef}
        className='flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:px-10 [&::-webkit-scrollbar]:hidden'
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={`relative shrink-0 snap-center overflow-hidden rounded-2xl bg-[#f1efe9] ${
              i === 0 ? 'h-[240px] w-[88vw] sm:h-[320px] sm:w-[72vw] lg:h-[400px] lg:w-[58vw]' : 'h-[200px] w-[72vw] sm:h-[280px] sm:w-[52vw] lg:h-[360px] lg:w-[42vw]'
            }`}
          >
            <Image
              src={src}
              alt={i === 0 ? event.title : `${event.title} ${i + 1}`}
              fill
              priority={i === 0}
              sizes='(max-width: 768px) 88vw, 58vw'
              className='object-cover'
            />
            {i === 0 ? (
              <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent' />
            ) : null}
          </div>
        ))}
      </div>
      {!hasUploads ? (
        <p className='mt-2 px-5 text-center text-[11px] text-[#9a9a9a] lg:px-10'>
          ※ イメージ写真です。当日の雰囲気イメージとしてご覧ください。
        </p>
      ) : null}
      {!hasUploads && !EVENT_CATEGORY_DEFAULT_IMAGE[event.category] ? (
        <div className={`mx-5 mt-2 flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} lg:mx-10`}>
          <span className='text-5xl opacity-70' aria-hidden>
            {meta.emoji}
          </span>
        </div>
      ) : null}
    </section>
  );
}
