'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { EVENT_CATEGORY_DEFAULT_IMAGE, EVENT_CATEGORY_META } from '@/lib/connection/data';
import { getGalleryImages } from '@/lib/connection/event-detail-ux';
import type { ConnectionEvent } from '@/lib/connection/types';

export function EventDetailGallery({ event }: { event: ConnectionEvent }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const meta = EVENT_CATEGORY_META[event.category];
  const images = getGalleryImages(event);
  const hasUploads = (event.imageUrls ?? []).filter(Boolean).length > 0;

  return (
    <section className='relative -mx-5 lg:-mx-10'>
      <BrandCharacterSlot id='Y' size='md' variant='peek' wrapperClassName='absolute -right-2 top-8 z-10 hidden sm:block' />
      <div
        ref={scrollRef}
        className='flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:gap-5 lg:px-10 [&::-webkit-scrollbar]:hidden'
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={`relative shrink-0 snap-center overflow-visible ${
              i === 0
                ? 'h-[260px] w-[90vw] sm:h-[340px] sm:w-[74vw] lg:h-[420px] lg:w-[60vw]'
                : 'mt-8 h-[200px] w-[70vw] sm:mt-12 sm:h-[280px] sm:w-[50vw] lg:h-[360px] lg:w-[40vw]'
            }`}
          >
            <div className='absolute inset-0 overflow-hidden rounded-[1.5rem] shadow-[0_16px_48px_rgba(26,26,26,0.12)]'>
              <Image
                src={src}
                alt={i === 0 ? event.title : `${event.title} ${i + 1}`}
                fill
                priority={i === 0}
                sizes='(max-width: 768px) 90vw, 60vw'
                className='object-cover transition duration-700 hover:scale-[1.03]'
              />
              {i === 0 ? (
                <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />
              ) : null}
            </div>
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
