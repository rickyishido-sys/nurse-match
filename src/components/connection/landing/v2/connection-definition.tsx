'use client';

import { motion } from 'motion/react';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { BRAND_CONCEPT, BRAND_TAGLINE } from '@/lib/connection/brand/tokens';

const CYCLE_STEPS = [
  { label: 'イベントを探す', color: HK.coral },
  { label: '参加申請', color: HK.violet },
  { label: 'リアル体験', color: HK.amber },
  { label: '次の体験へ', color: HK.sky },
] as const;

export function LandingConnectionDefinition() {
  return (
    <Section
      tone='white'
      id='hanakai-connection'
      className='relative overflow-hidden !bg-gradient-to-br from-white via-[#fff8f5] to-[#f0f8ff]'
    >
      <BgTypography text='華会' className='!text-[#1f5d4f]/[0.06]' />
      <ColorBlob color={HK.violetSoft} className='right-0 top-[20%]' />
      <ColorBlob color={HK.coralSoft} className='bottom-[10%] left-0' />

      <div className='relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left'>
        <Reveal>
          <Kicker>華会</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>
            体験をデザインする、
            <br className='sm:hidden' />
            <span className='hk-text-gradient'>華会</span>とは
          </Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[48ch]'>
            {BRAND_TAGLINE}
            <br />
            {BRAND_CONCEPT}
            <br />
            イベントを探し、参加申請し、リアルな場で体験する——それが Ver1.0 の HANAKAI Connection です。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='relative z-10 mt-16'>
        <p className='mb-8 text-center text-[11px] font-bold tracking-[0.24em] text-[#9a9a9a] lg:text-left'>
          参加の流れ
        </p>
        <div className='flex flex-wrap items-center justify-center gap-4 lg:justify-start'>
          {CYCLE_STEPS.map((step, i) => (
            <TiltFrame key={step.label} tilt={i % 2 === 0 ? -3 : 4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * i }}
                className='rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg'
                style={{ background: step.color }}
              >
                {step.label}
              </motion.div>
            </TiltFrame>
          ))}
        </div>
        <p className='mt-10 text-center text-sm leading-8 text-[#5a5247] lg:text-left'>
          プロフィールを整え、体験に参加し、また次のイベントへ——リアルな出会いを重ねていきます。
        </p>
      </Reveal>
    </Section>
  );
}
