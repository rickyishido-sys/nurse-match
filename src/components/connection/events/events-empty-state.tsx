'use client';

import Link from 'next/link';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';

export function EventsEmptyState() {
  return (
    <div className='relative overflow-hidden py-8'>
      <BgTypography text='華会' />
      <BrandCharacterSlot id='N' size='xl' variant='peek' wrapperClassName='absolute -right-2 top-8' />
      <BrandReveal>
        <GlassSurface className='relative mx-auto max-w-lg text-center'>
          <h2 className='font-serif text-lg font-semibold text-[#1a1a1a]'>
            ただいま、次の華会・イベントを準備しています。
          </h2>
          <p className='mx-auto mt-3 max-w-md text-sm leading-8 text-[#6b6b6b]'>
            花やカフェ、散歩など——あなたに合う体験をひとつずつ整えています。
            公開まで、もう少しお待ちください。
          </p>
          <div className='mt-8 flex flex-col items-center gap-3'>
            <Link href='/register' className={ctaPrimary}>
              開催情報を受け取る
            </Link>
            <Link
              href='/contact?category=event'
              className='text-sm font-semibold text-[#1f5d4f] underline-offset-4 hover:underline'
            >
              イベント開催を希望する
            </Link>
          </div>
        </GlassSurface>
      </BrandReveal>
    </div>
  );
}
