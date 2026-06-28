'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const NODES = [
  'リアルイベント',
  'アプリで交流',
  '人柄を知る',
  '応援する',
  '再会する',
  '仲間を紹介する',
  '再びイベントへ',
];

export function LandingCycle() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setActive((i) => (i + 1) % NODES.length), 1500);
    return () => clearInterval(t);
  }, [reduced]);

  const R = 41; // % radius

  return (
    <Section tone='green'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker dark>Point 02</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading dark className='mt-5'>
            リアルで出会う
            <br className='sm:hidden' />
            コミュニティ
          </Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead dark className='mt-6 max-w-[42ch]'>
            一度きりの出会いで終わらせない。イベントのあともアプリでつながり、
            応援し合い、また会う。花会は巡り続けるコミュニティです。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='mt-16'>
        <div className='relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[480px]'>
          {/* 円環の軌道 */}
          <div className='absolute inset-[9%] rounded-full border border-dashed border-white/25' />

          {/* 中央のラベル */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/10 text-center backdrop-blur sm:h-28 sm:w-28'>
              <span className='text-2xl' aria-hidden>
                ✿
              </span>
              <span className='mt-1 text-[11px] font-semibold tracking-[0.2em] text-white/90'>HANAKAI</span>
            </div>
          </div>

          {NODES.map((label, i) => {
            const theta = (-90 + (360 / NODES.length) * i) * (Math.PI / 180);
            const left = 50 + R * Math.cos(theta);
            const top = 50 + R * Math.sin(theta);
            const isActive = i === active;
            return (
              <motion.div
                key={label}
                className='absolute -translate-x-1/2 -translate-y-1/2'
                style={{ left: `${left}%`, top: `${top}%` }}
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className='flex min-w-[84px] items-center justify-center rounded-full px-3 py-2 text-[10.5px] font-semibold leading-tight transition-colors duration-500 sm:min-w-[100px] sm:text-xs'
                  style={{
                    backgroundColor: isActive ? HK.gold : 'rgba(255,255,255,0.92)',
                    color: isActive ? '#fff' : HK.green,
                    boxShadow: isActive ? '0 8px 24px rgba(184,149,106,0.45)' : '0 4px 14px rgba(0,0,0,0.18)',
                  }}
                >
                  {label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
