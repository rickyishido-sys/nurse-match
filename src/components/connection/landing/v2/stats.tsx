'use client';

import { Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

/** 将来の実数値に差し替え可能な統計UI（現時点はプレースホルダー） */
const STATS = [
  { label: '参加メンバー', value: '—', hint: '累計' },
  { label: '開催イベント', value: '—', hint: '累計' },
  { label: 'Connection成立', value: '—', hint: '累計' },
] as const;

export function LandingStats() {
  return (
    <Section tone='white' className='!py-12 sm:!py-16 lg:!py-20'>
      <Reveal>
        <div className='mx-auto max-w-[880px] rounded-[2rem] border border-[#ece3d4] bg-gradient-to-br from-[#faf7f2] to-white px-6 py-10 sm:px-10 sm:py-12'>
          <div className='text-center'>
            <Kicker>Community</Kicker>
            <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>
              コミュニティの歩みは、順次ここに公開していきます。
            </p>
          </div>
          <div className='mt-8 grid gap-6 sm:grid-cols-3 sm:gap-4'>
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className='flex flex-col items-center rounded-2xl bg-white px-4 py-6 text-center shadow-[0_4px_20px_rgba(26,26,26,0.04)]'
              >
                <p
                  className='font-serif text-[2.4rem] font-semibold leading-none tracking-tight text-[#1f5d4f] sm:text-[2.8rem]'
                  aria-label={`${stat.label} ${stat.value}`}
                >
                  {stat.value}
                </p>
                <p className='mt-3 text-sm font-semibold text-[#1a1a1a]'>{stat.label}</p>
                <p className='mt-1 text-[10px] tracking-wide text-[#9a9a9a]'>{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
