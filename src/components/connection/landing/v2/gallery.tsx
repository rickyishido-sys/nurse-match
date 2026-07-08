'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Heading, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FEATURED = [
  { src: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png', alt: 'カフェで話す様子' },
  { src: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png', alt: '花の体験イベント' },
  { src: '/hero/desktop/Stroll.png', mobile: '/hero/mobile/Stroll.png', alt: '街を歩く様子' },
] as const;

const GRID = [
  '/hero/mobile/bar.png',
  '/hero/mobile/fitness.png',
  '/categories/cafe.png',
  '/categories/stroll.png',
] as const;

export function LandingGallery() {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            楽しそうな体験の写真を、大きく見せています。
            カフェ、食事、散歩、運動——どの場でも、自然な会話が生まれます。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className='mt-12 grid gap-3 sm:gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5'>
          <button
            type='button'
            onClick={() => setOpen(FEATURED[0].src)}
            className='group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f1efe9] lg:col-span-7 lg:row-span-2 lg:aspect-auto lg:min-h-[420px]'
            aria-label='イベント写真を拡大'
          >
            <Image
              src={FEATURED[0].src}
              alt={FEATURED[0].alt}
              fill
              sizes='(max-width: 1024px) 100vw, 58vw'
              className='hidden object-cover transition duration-700 group-hover:scale-[1.03] lg:block'
            />
            <Image
              src={FEATURED[0].mobile}
              alt={FEATURED[0].alt}
              fill
              sizes='100vw'
              className='object-cover transition duration-700 group-hover:scale-[1.03] lg:hidden'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent' />
            <p className='absolute bottom-4 left-4 text-sm font-semibold text-white'>カフェで話す</p>
          </button>

          {FEATURED.slice(1).map((photo) => (
            <button
              key={photo.src}
              type='button'
              onClick={() => setOpen(photo.src)}
              className='group relative hidden aspect-[16/10] overflow-hidden rounded-2xl bg-[#f1efe9] lg:col-span-5 lg:block'
              aria-label='イベント写真を拡大'
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes='42vw'
                className='object-cover transition duration-700 group-hover:scale-[1.03]'
              />
            </button>
          ))}

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-5 lg:grid-cols-2 lg:gap-4'>
            {GRID.map((src, i) => (
              <button
                key={src}
                type='button'
                onClick={() => setOpen(src)}
                className='group relative aspect-square overflow-hidden rounded-xl bg-[#f1efe9] sm:rounded-2xl'
                aria-label={`イベント写真 ${i + 1} を拡大`}
              >
                <Image
                  src={src}
                  alt={`イベント風景 ${i + 1}`}
                  fill
                  sizes='(max-width: 640px) 45vw, 220px'
                  className='object-cover transition duration-500 group-hover:scale-105'
                />
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <AnimatePresence>
        {open ? (
          <motion.div
            className='fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className='relative aspect-[4/3] w-full max-w-[720px] overflow-hidden rounded-2xl'
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={open} alt='' fill sizes='720px' className='object-cover' />
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
