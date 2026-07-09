'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ColorBlob, ScatterCharacters, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FEATURED = [
  { src: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png', alt: 'カフェで話す様子', tilt: -4, label: 'カフェで話す', ring: HK.coral },
  { src: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png', alt: '花の体験イベント', tilt: 3, label: '花の体験', ring: HK.violet },
  { src: '/hero/desktop/Stroll.png', mobile: '/hero/mobile/Stroll.png', alt: '街を歩く様子', tilt: -2, label: '街を歩く', ring: HK.sky },
] as const;

const GRID = [
  { src: '/hero/mobile/bar.png', tilt: 5, ring: HK.amber },
  { src: '/hero/mobile/fitness.png', tilt: -3, ring: HK.lime },
  { src: '/categories/cafe.png', tilt: 4, ring: HK.coral },
  { src: '/categories/stroll.png', tilt: -5, ring: HK.violet },
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
    <Section tone='white' className='relative overflow-hidden'>
      <ColorBlob color={HK.coralSoft} className='left-[-8%] top-[5%]' />
      <ColorBlob color={HK.violetSoft} className='right-[-5%] bottom-[10%]' />
      <ScatterCharacters ids={['D1', 'N', 'E2']} />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Gallery</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>実際のイベント風景</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            斜めに重なる写真のように、体験も重なり合う。
            カフェ、食事、散歩、運動——どの場でも、自然な会話が生まれます。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className='relative z-10 mt-12 lg:mt-16'>
          <TiltFrame tilt={-3} hover={false} className='mx-auto max-w-[92%] lg:max-w-none'>
            <button
              type='button'
              onClick={() => setOpen(FEATURED[0].src)}
              className='group relative block w-full overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-4 ring-white'
              style={{ boxShadow: `0 24px 60px rgba(0,0,0,0.18), 0 0 0 4px ${FEATURED[0].ring}33` }}
              aria-label='イベント写真を拡大'
            >
              <div className='relative aspect-[4/3] lg:aspect-[16/9] lg:min-h-[380px]'>
                <Image
                  src={FEATURED[0].src}
                  alt={FEATURED[0].alt}
                  fill
                  sizes='(max-width: 1024px) 100vw, 1080px'
                  className='hidden object-cover transition duration-700 group-hover:scale-[1.03] lg:block'
                />
                <Image
                  src={FEATURED[0].mobile}
                  alt={FEATURED[0].alt}
                  fill
                  sizes='100vw'
                  className='object-cover transition duration-700 group-hover:scale-[1.03] lg:hidden'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent' />
                <p className='absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-[#1a1a1a] shadow-lg'>
                  {FEATURED[0].label}
                </p>
              </div>
            </button>
          </TiltFrame>

          <div className='mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-6 lg:mt-10'>
            {FEATURED.slice(1).map((photo) => (
              <TiltFrame key={photo.src} tilt={photo.tilt} className='w-[calc(50%-10px)] sm:w-[220px] lg:w-[280px]'>
                <button
                  type='button'
                  onClick={() => setOpen(photo.src)}
                  className='group relative block w-full overflow-hidden rounded-[1.5rem] shadow-xl ring-2 ring-white'
                  style={{ boxShadow: `0 16px 40px rgba(0,0,0,0.12), 0 0 0 2px ${photo.ring}44` }}
                  aria-label='イベント写真を拡大'
                >
                  <div className='relative aspect-[4/5]'>
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes='280px'
                      className='object-cover transition duration-700 group-hover:scale-[1.05]'
                    />
                  </div>
                </button>
              </TiltFrame>
            ))}
          </div>

          <div className='mt-10 flex flex-wrap justify-center gap-4 sm:gap-5'>
            {GRID.map((item, i) => (
              <TiltFrame key={item.src} tilt={item.tilt} className='w-[calc(50%-8px)] sm:w-[140px]'>
                <button
                  type='button'
                  onClick={() => setOpen(item.src)}
                  className='group relative block w-full overflow-hidden rounded-2xl shadow-lg ring-2 ring-white'
                  style={{ boxShadow: `0 12px 32px rgba(0,0,0,0.1), 0 0 0 2px ${item.ring}55` }}
                  aria-label={`イベント写真 ${i + 1} を拡大`}
                >
                  <div className='relative aspect-square'>
                    <Image
                      src={item.src}
                      alt={`イベント風景 ${i + 1}`}
                      fill
                      sizes='140px'
                      className='object-cover transition duration-500 group-hover:scale-110'
                    />
                  </div>
                </button>
              </TiltFrame>
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
              initial={{ scale: 0.92, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
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
