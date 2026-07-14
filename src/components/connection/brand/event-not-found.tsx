'use client';

import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import type { HanakaiViewer } from '@/lib/hanakai/session';

export function EventNotFoundContent({ viewer }: { viewer: HanakaiViewer | null }) {
  return (
    <ConnectionShell viewer={viewer}>
      <div className='relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden py-12 text-center'>
        <BgTypography text='体験' />
        <BrandCharacterSlot id='Y' size='lg' variant='peek' wrapperClassName='absolute -left-2 top-[18%]' />
        <BrandReveal className='relative z-10 max-w-md'>
          <GlassSurface className='text-center'>
            <h1 className='font-serif text-xl font-semibold tracking-tight text-[#1a1a1a]'>
              イベントが見つかりませんでした
            </h1>
            <p className='mx-auto mt-3 text-sm leading-7 text-[#6b6b6b]'>
              イベントが終了・削除されたか、URLが正しくない可能性があります。
            </p>
            <Link href='/events' className={`mt-7 ${ctaPrimary}`}>
              イベント一覧へ戻る
            </Link>
          </GlassSurface>
        </BrandReveal>
      </div>
    </ConnectionShell>
  );
}
