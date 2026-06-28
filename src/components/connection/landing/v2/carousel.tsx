'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { HK } from '@/components/connection/landing/v2/ui';

/**
 * 1枚ずつ大きく見せる横スワイプカルーセル（scroll-snap）。
 * モバイルはスワイプ、PCは矢印＋ドットで操作。
 */
export function SnapCarousel({
  items,
  ariaLabel,
}: {
  items: ReactNode[];
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(items.length - 1, i)));
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className='relative' role='group' aria-label={ariaLabel}>
      <div
        ref={trackRef}
        className='flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {items.map((item, i) => (
          <div key={i} className='w-full shrink-0 snap-center px-1.5'>
            {item}
          </div>
        ))}
      </div>

      <div className='mt-7 flex items-center justify-center gap-5'>
        <button
          type='button'
          aria-label='前へ'
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cdbb] text-[#1a1a1a] transition disabled:opacity-30'
        >
          ‹
        </button>

        <div className='flex items-center gap-2'>
          {items.map((_, i) => (
            <button
              key={i}
              type='button'
              aria-label={`${i + 1}枚目へ`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className='h-1.5 rounded-full transition-all duration-300'
              style={{
                width: i === active ? 22 : 6,
                backgroundColor: i === active ? HK.gold : '#d8cdbb',
              }}
            />
          ))}
        </div>

        <button
          type='button'
          aria-label='次へ'
          onClick={() => goTo(Math.min(items.length - 1, active + 1))}
          disabled={active === items.length - 1}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cdbb] text-[#1a1a1a] transition disabled:opacity-30'
        >
          ›
        </button>
      </div>
    </div>
  );
}
