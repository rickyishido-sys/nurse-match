'use client';

import { ConnectionShell } from '@/components/connection/shell';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BgTypography } from '@/components/connection/brand/bg-typography';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#ebe9e4]/60 ${className ?? ''}`} />;
}

export default function EventsLoading() {
  return (
    <ConnectionShell viewer={null}>
      <div className='relative space-y-10 overflow-hidden' aria-busy='true' aria-label='読み込み中'>
        <BgTypography text='体験' className='opacity-50' animate={false} />
        <BrandCharacterSlot id='D1' size='md' variant='float' wrapperClassName='absolute right-4 top-8' />
        <div className='relative z-10 space-y-4'>
          <SkeletonBlock className='h-3 w-24' />
          <SkeletonBlock className='h-10 w-56' />
          <SkeletonBlock className='h-4 w-full max-w-md' />
        </div>
        <div className='relative z-10 space-y-6'>
          <SkeletonBlock className='h-72 w-full rounded-[1.75rem]' />
          <SkeletonBlock className='ml-6 h-72 w-[92%] rounded-[1.75rem]' />
        </div>
      </div>
    </ConnectionShell>
  );
}
