'use client';

import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { HK } from '@/lib/connection/brand/tokens';

const STATS = [
  { label: '参加メンバー', value: '—', hint: '累計', color: HK.coral, char: 'W' as const, tilt: -3 },
  { label: '開催体験', value: '—', hint: '累計', color: HK.violet, char: 'E1' as const, tilt: 2 },
  { label: 'つながり', value: '—', hint: '累計', color: HK.amber, char: 'S' as const, tilt: -2 },
] as const;

export function LandingStats() {
  return (
    <Section tone='cream' className='relative overflow-hidden !py-16 sm:!py-24'>
      <ColorBlob color={HK.skySoft} className='left-[20%] top-0' />

      <Reveal>
        <div className='relative mx-auto w-full max-w-[1080px]'>
          <div className='text-center'>
            <Kicker>Community</Kicker>
            <p className='mt-4 text-base font-medium text-[#5a5247] sm:text-lg'>
              コミュニティの歩みは、順次ここに公開していきます。
            </p>
          </div>

          <div className='mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-3 sm:gap-7 lg:gap-8'>
            {STATS.map((stat, i) => (
              <TiltFrame key={stat.label} tilt={stat.tilt} className={`w-full ${i === 1 ? 'sm:-mt-6' : ''}`}>
                <div
                  className='relative flex min-h-[220px] w-full flex-col items-center justify-center overflow-visible rounded-[2rem] px-8 py-12 text-center shadow-[0_20px_56px_rgba(26,26,26,0.1)] sm:min-h-[260px] sm:px-10 sm:py-14 lg:min-h-[280px] lg:rounded-[2.25rem] lg:px-12 lg:py-16'
                  style={{ background: `linear-gradient(160deg, ${stat.color}18, white 70%)` }}
                >
                  <div className='pointer-events-none absolute -right-3 -top-4 sm:-right-4 sm:-top-5'>
                    <BrandCharacter id={stat.char} size='sm' variant='peek' />
                  </div>
                  <p
                    className='font-serif text-[3.5rem] font-bold leading-none sm:text-[4.25rem] lg:text-[5rem]'
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className='mt-5 text-base font-bold text-[#1a1a1a] sm:text-lg lg:text-xl'>{stat.label}</p>
                  <p className='mt-2 text-xs tracking-wide text-[#9a9a9a] sm:text-sm'>{stat.hint}</p>
                </div>
              </TiltFrame>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
