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
    <Section tone='cream' className='relative overflow-hidden !py-14 sm:!py-20'>
      <ColorBlob color={HK.skySoft} className='left-[20%] top-0' />

      <Reveal>
        <div className='relative mx-auto max-w-[920px]'>
          <div className='text-center'>
            <Kicker>Community</Kicker>
            <p className='mt-3 text-sm font-medium text-[#5a5247]'>
              コミュニティの歩みは、順次ここに公開していきます。
            </p>
          </div>

          <div className='mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-center sm:gap-5'>
            {STATS.map((stat, i) => (
              <TiltFrame key={stat.label} tilt={stat.tilt} className={i === 1 ? 'sm:-mt-4' : ''}>
                <div
                  className='relative flex flex-col items-center overflow-visible rounded-[1.75rem] px-6 py-8 text-center shadow-[0_16px_48px_rgba(26,26,26,0.08)]'
                  style={{ background: `linear-gradient(160deg, ${stat.color}15, white)` }}
                >
                  <div className='pointer-events-none absolute -right-2 -top-3'>
                    <BrandCharacter id={stat.char} size='xs' variant='peek' />
                  </div>
                  <p
                    className='font-serif text-[2.6rem] font-bold leading-none sm:text-[3rem]'
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className='mt-3 text-sm font-bold text-[#1a1a1a]'>{stat.label}</p>
                  <p className='mt-1 text-[10px] tracking-wide text-[#9a9a9a]'>{stat.hint}</p>
                </div>
              </TiltFrame>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
