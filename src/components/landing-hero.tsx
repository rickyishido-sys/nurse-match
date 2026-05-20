'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const HERO_IMAGES = [
  '/hero/nurse-hero-01.png?v=20260520-1426',
  '/hero/nurse-hero-02.png?v=20260520-1426',
  '/hero/nurse-hero-03.png?v=20260520-1426',
  '/hero/nurse-hero-04.png?v=20260520-1426',
  '/hero/nurse-hero-05.png?v=20260520-1426',
];

export function LandingHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const randomize = window.setTimeout(() => {
      setActiveIndex(Math.floor(Math.random() * HERO_IMAGES.length));
    }, 0);

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);

    return () => {
      window.clearTimeout(randomize);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <article className='relative min-h-[84svh] overflow-hidden rounded-[34px] border border-slate-200/20 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]'>
      <div className='absolute inset-0 z-0 overflow-hidden'>
        {HERO_IMAGES.map((src, index) => (
          <div
            key={src}
            className={`hero-image-layer ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `url('${src}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden='true'
          />
        ))}
      </div>
      <div className='absolute inset-0 z-10 bg-gradient-to-b from-black/5 via-black/15 to-black/45' />

      <div className='relative z-20 flex min-h-[84svh] flex-col justify-end px-6 pb-8 pt-10 text-white'>
        <p className='text-xs font-semibold tracking-[0.24em] text-slate-200'>NURSE MATCH</p>
        <h1 className='mt-3 text-[2rem] font-bold leading-[1.3] tracking-tight'>
          選ぶのは、
          <br />
          看護師のあなた。
        </h1>
        <p className='mt-4 text-sm leading-7 text-slate-200'>
          看護師限定の安心感と、
          <br />
          審査制の出会いを。
        </p>

        <Link
          href='/register'
          className='mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-white text-base font-bold text-slate-900 shadow-[0_12px_24px_-12px_rgba(255,255,255,0.95)]'
        >
          はじめる
        </Link>

        <div className='mt-4 flex gap-2 text-[10px] font-medium text-slate-200/95'>
          <span className='rounded-full border border-white/30 bg-white/10 px-3 py-1'>本人確認</span>
          <span className='rounded-full border border-white/30 bg-white/10 px-3 py-1'>看護師確認</span>
          <span className='rounded-full border border-white/30 bg-white/10 px-3 py-1'>審査制</span>
        </div>
      </div>
    </article>
  );
}
