'use client';

import { motion } from 'motion/react';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { BRAND_TAGLINE } from '@/lib/connection/brand/tokens';

const CYCLE_STEPS = ['リアルイベント', 'アプリで交流', '応援する', '再会する', '再びイベントへ'];

export function LandingConnectionDefinition() {
  return (
    <Section tone='white' id='hanakai-connection' className='relative overflow-hidden'>
      <BgTypography text='華会' className='!opacity-60' />
      <div className='pointer-events-none absolute -right-2 top-[15%] hidden sm:block'>
        <BrandCharacter id='D1' size='lg' variant='peek' />
      </div>
      <div className='pointer-events-none absolute -left-4 bottom-[10%]'>
        <BrandCharacter id='N' size='md' variant='float' />
      </div>
      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>華会</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>体験をデザインする、華会とは</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[48ch] text-left sm:text-center'>
            {BRAND_TAGLINE}
            <br className='hidden sm:block' />
            <br className='hidden sm:block' />
            イベントで出会い、コミュニティで交流し、また次の体験で再会する。
            <br className='hidden sm:block' />
            <br className='hidden sm:block' />
            この循環そのものが、HANAKAI Connectionの体験です。
            <br className='hidden sm:block' />
            体験は、その最初のきっかけです。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='mt-14'>
        <div className='mx-auto max-w-3xl'>
          <p className='mb-6 text-center text-[11px] font-semibold tracking-[0.2em] text-[#9a9a9a]'>
            Connectionの循環
          </p>
          <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center'>
            {CYCLE_STEPS.map((step, i) => (
              <div key={step} className='flex items-center gap-3 sm:gap-2'>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * i }}
                  className='flex flex-1 items-center justify-center rounded-full border border-[#e8dfd0] bg-gradient-to-br from-[#fbf8f3] to-[#eef3ef] px-5 py-3 text-sm font-semibold text-[#1a1a1a] shadow-sm sm:flex-none sm:min-w-[120px]'
                >
                  {step}
                </motion.div>
                {i < CYCLE_STEPS.length - 1 ? (
                  <span className='hidden text-lg text-[#b8956a] sm:inline' aria-hidden>
                    →
                  </span>
                ) : null}
                {i < CYCLE_STEPS.length - 1 ? (
                  <span className='mx-auto text-lg text-[#b8956a] sm:hidden' aria-hidden>
                    ↓
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <p className='mt-8 text-center text-xs leading-7 text-[#6b6b6b]'>
            毎週新しいイベント案内が届き、参加・交流・再会が続いていく。
            <br className='hidden sm:block' />
            それが<span style={{ color: HK.green }}> HANAKAI Connection </span>の体験です。
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
