'use client';

import { Heading, HK, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const VOICES = [
  {
    quote: '花に集中していたら、自然に会話が始まっていました。',
    who: '30代・女性',
    tag: '初参加',
    initial: 'A',
  },
  {
    quote: '大人になってから友達ができるとは思いませんでした。',
    who: '40代・男性',
    tag: '3回参加',
    initial: 'K',
  },
  {
    quote: 'また来月も参加したいです。次が待ち遠しい。',
    who: '20代・女性',
    tag: '常連',
    initial: 'M',
  },
  {
    quote: '初参加でしたが、運営の方がいて安心できました。',
    who: '30代・女性',
    tag: '初参加',
    initial: 'S',
  },
  {
    quote: '一人で行ったのに、帰る頃には仲間ができていた。',
    who: '50代・女性',
    tag: '2回参加',
    initial: 'Y',
  },
  {
    quote: 'SNSではなく、リアルで話せる場所がほしかった。',
    who: '30代・男性',
    tag: '初参加',
    initial: 'T',
  },
] as const;

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
        <Reveal delay={0.08}>
          <p className='mt-5 max-w-[36ch] text-sm leading-7 text-white/75'>
            ※ 表示はUIサンプルです。実際の参加者の声は順次掲載予定です。
          </p>
        </Reveal>
      </div>

      <div className='mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'>
        {VOICES.map((v, i) => (
          <Reveal key={v.quote} delay={0.05 * i}>
            <article className='flex h-full flex-col rounded-[1.75rem] bg-white/95 px-6 py-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'>
              <div className='flex items-center gap-3'>
                <span
                  className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white'
                  style={{ backgroundColor: HK.gold }}
                  aria-hidden
                >
                  {v.initial}
                </span>
                <div className='min-w-0 text-left'>
                  <p className='text-sm font-semibold text-[#1a1a1a]'>{v.who}</p>
                  <p className='text-[11px] text-[#9a9a9a]'>{v.tag}</p>
                </div>
              </div>
              <p className='mt-5 flex-1 font-serif text-[15px] leading-[1.9] text-[#1a1a1a]'>
                「{v.quote}」
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
