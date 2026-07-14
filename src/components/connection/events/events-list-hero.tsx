'use client';

import Image from 'next/image';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { BRAND_SUBLINE, HK } from '@/lib/connection/brand/tokens';

export function EventsListHero() {
  return (
    <div className='relative min-h-[300px] overflow-visible py-4 sm:min-h-[340px]'>
      <BgTypography text='体験' className='!text-[#1f5d4f]/[0.05]' />
      <ColorBlob color={HK.coralSoft} className='right-[10%] top-0' />
      <ColorBlob color={HK.violetSoft} className='bottom-0 left-[5%]' />

      {/* 斜めに重なる写真 */}
      <div className='pointer-events-none absolute right-0 top-0 z-[1] h-[220px] w-[58%] sm:h-[280px] sm:w-[50%]'>
        <TiltFrame tilt={-5} hover={false} className='absolute right-0 top-2 h-[88%] w-[80%]'>
          <div className='relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(232,93,76,0.2)] ring-2 ring-white'>
            <Image src='/hero/mobile/cafe.png' alt='' fill sizes='50vw' className='object-cover' />
            <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
          </div>
        </TiltFrame>
        <TiltFrame tilt={6} hover={false} className='absolute -left-2 bottom-0 h-[62%] w-[48%]'>
          <div className='relative h-full w-full overflow-hidden rounded-[1.25rem] border-4 border-white shadow-xl'>
            <Image src='/hero/mobile/flower.png' alt='' fill sizes='28vw' className='object-cover' />
          </div>
        </TiltFrame>
      </div>

      <BrandCharacterSlot id='E2' size='lg' variant='peek' className='-rotate-6' wrapperClassName='absolute -left-3 bottom-4 z-[3] sm:bottom-8' />
      <BrandCharacterSlot id='A' size='sm' variant='float' className='rotate-10' wrapperClassName='absolute right-[6%] top-[48%] z-[3] hidden sm:block' />

      <BrandReveal className='relative z-[2] max-w-[56%] pt-2 sm:max-w-[50%] sm:pt-6'>
        <BrandLogo iconOnly size='sm' href={null} className='mb-3' />
        <TiltFrame tilt={-2} hover={false}>
          <GlassSurface className='!border-white/80 !bg-white/85'>
            <p className='text-[11px] font-bold tracking-[0.28em]' style={{ color: HK.coral }}>
              毎週開催
            </p>
            <h1 className='mt-2 font-serif text-[1.45rem] font-bold leading-[1.3] text-[#1a1a1a] sm:text-[1.9rem]'>
              体験からはじまる、
              <br />
              新しい出会い
            </h1>
            <p className='mt-3 text-xs leading-[1.9] text-[#5a5247] sm:text-sm'>{BRAND_SUBLINE}</p>
          </GlassSurface>
        </TiltFrame>
      </BrandReveal>
    </div>
  );
}
