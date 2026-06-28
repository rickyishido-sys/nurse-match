'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const PHOTOS = [
  '/hero/mobile/flower.png',
  '/hero/mobile/cafe.png',
  '/hero/mobile/bar.png',
  '/hero/mobile/fitness.png',
  '/hero/mobile/Stroll.png',
  '/categories/flower.png',
  '/categories/cafe.png',
  '/categories/stroll.png',
  '/categories/fitness.png',
];

export function LandingGallery() {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Section tone='white'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Gallery</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>実際のイベント風景</Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div className='mt-12 grid grid-cols-3 gap-1.5 sm:gap-2.5'>
          {PHOTOS.map((src, i) => (
            <button
              key={src}
              type='button'
              onClick={() => setOpen(i)}
              className='group relative aspect-square overflow-hidden rounded-md bg-[#f1efe9] sm:rounded-lg'
              aria-label={`イベント写真 ${i + 1} を拡大`}
            >
              <Image
                src={src}
                alt={`イベント風景 ${i + 1}`}
                fill
                sizes='(max-width: 640px) 33vw, 340px'
                className='object-cover transition duration-500 group-hover:scale-105'
              />
            </button>
          ))}
        </div>
      </Reveal>

      <AnimatePresence>
        {open !== null ? (
          <motion.div
            className='fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className='relative aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl'
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={PHOTOS[open]} alt='' fill sizes='560px' className='object-cover' />
            </motion.div>
            <button
              type='button'
              onClick={() => setOpen(null)}
              aria-label='閉じる'
              className='absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur'
            >
              ×
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Section>
  );
}
