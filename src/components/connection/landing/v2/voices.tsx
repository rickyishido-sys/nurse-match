'use client';

import { Heading, HK, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { SnapCarousel } from '@/components/connection/landing/v2/carousel';

const VOICES = [
  { quote: '花に集中していたら、自然に会話が始まっていました。', who: '30代・女性 / 初参加' },
  { quote: '大人になってから友達ができるとは思いませんでした。', who: '40代・男性 / 3回目' },
  { quote: 'また来月も参加したいです。次が待ち遠しい。', who: '20代・女性 / 常連' },
  { quote: '初参加でしたが、運営の方がいて安心できました。', who: '30代・女性 / 初参加' },
  { quote: '一人で行ったのに、帰る頃には仲間ができていた。', who: '50代・女性 / 2回目' },
];

export function LandingVoices() {
  return (
    <Section tone='green'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker dark>Voices</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading dark className='mt-5'>
            参加者の声
          </Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1} className='mx-auto mt-12 max-w-[620px]'>
        <SnapCarousel
          ariaLabel='参加者の声'
          items={VOICES.map((v) => (
            <div
              key={v.quote}
              className='flex min-h-[240px] flex-col items-center justify-center rounded-3xl bg-white/95 px-8 py-12 text-center'
            >
              <span className='font-serif text-4xl leading-none' style={{ color: HK.gold }} aria-hidden>
                “
              </span>
              <p className='mt-3 max-w-[24ch] font-serif text-lg leading-[1.9] text-[#1a1a1a]'>{v.quote}</p>
              <p className='mt-6 text-xs tracking-wide text-[#9a9a9a]'>{v.who}</p>
            </div>
          ))}
        />
      </Reveal>
    </Section>
  );
}
