'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Heading, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FLOWERS = ['🌸', '🌷', '🌼', '🌺', '💐'];

type Petal = { id: number; emoji: string; x: number; rotate: number; scale: number };

export function LandingSupport() {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [count, setCount] = useState(128);

  const throwFlowers = () => {
    setCount((c) => c + 1);
    const burst: Petal[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      x: (Math.random() - 0.5) * 160,
      rotate: (Math.random() - 0.5) * 80,
      scale: 0.8 + Math.random() * 0.6,
    }));
    setPetals((prev) => [...prev, ...burst]);
    window.setTimeout(() => {
      setPetals((prev) => prev.filter((p) => !burst.some((b) => b.id === p.id)));
    }, 1900);
  };

  return (
    <Section tone='warm'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 06</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>応援し合えるコミュニティ</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            花会では、参加者同士が応援し合います。イベントを開いたり、知識を分かち合ったり、
            素敵な投稿をした人へ「花」を贈ることができます。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className='mx-auto mt-14 flex max-w-[420px] flex-col items-center rounded-3xl bg-white px-8 py-12 text-center shadow-[0_10px_40px_rgba(26,26,26,0.06)]'>
          <span className='flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ebe0] text-2xl' aria-hidden>
            ✿
          </span>
          <p className='mt-5 text-base font-semibold text-[#1a1a1a]'>Hana さんの投稿</p>
          <p className='mt-1 text-xs text-[#9a9a9a]'>素敵だと思ったら、花を贈ろう</p>

          <div className='relative mt-8'>
            <AnimatePresence>
              {petals.map((p) => (
                <motion.span
                  key={p.id}
                  className='pointer-events-none absolute left-1/2 top-0 text-2xl'
                  initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -150, x: p.x, rotate: p.rotate, scale: p.scale }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  aria-hidden
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>

            <motion.button
              type='button'
              onClick={throwFlowers}
              whileTap={{ scale: 0.94 }}
              className='relative z-10 flex items-center gap-2 rounded-full bg-[#1f5d4f] px-7 py-3.5 text-sm font-semibold text-white shadow-md'
            >
              <span className='text-base'>❀</span>
              花を贈る
            </motion.button>
          </div>

          <p className='mt-6 text-sm font-medium' style={{ color: '#b8956a' }}>
            ❀ {count} 本の花が贈られました
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
