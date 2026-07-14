'use client';

import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BrandCharacterScatter } from '@/components/connection/brand/brand-character-slot';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const VOICES = [
  { quote: '花に集中していたら、自然に会話が始まっていました。', who: '30代・女性', tag: '初参加', initial: 'A', accent: HK.coral, tilt: -3 },
  { quote: '大人になってから友達ができるとは思いませんでした。', who: '40代・男性', tag: '3回参加', initial: 'K', accent: HK.amber, tilt: 4 },
  { quote: 'また来月も参加したいです。次が待ち遠しい。', who: '20代・女性', tag: '常連', initial: 'M', accent: HK.violet, tilt: -2 },
  { quote: '初参加でしたが、運営の方がいて安心できました。', who: '30代・女性', tag: '初参加', initial: 'S', accent: HK.sky, tilt: 5 },
  { quote: '一人で行ったのに、帰る頃には仲間ができていた。', who: '50代・女性', tag: '2回参加', initial: 'Y', accent: HK.lime, tilt: -4 },
  { quote: 'SNSではなく、リアルで話せる場所がほしかった。', who: '30代・男性', tag: '初参加', initial: 'T', accent: HK.coral, tilt: 3 },
] as const;

export function LandingVoices() {
  return (
    <Section tone='green' className='relative overflow-hidden !bg-gradient-to-br from-[#0f2820] via-[#163f35] to-[#1a3040]'>
      <ColorBlob color={HK.violetSoft} className='right-[5%] top-[10%] opacity-40' />
      <ColorBlob color={HK.coralSoft} className='left-[3%] bottom-[20%] opacity-35' />
      <BrandCharacterScatter ids={['Y', 'A', 'S']} />

      <div className='relative z-10 flex flex-col items-center text-center'>
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

      <div className='relative z-10 mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8'>
        {VOICES.map((v, i) => (
          <Reveal key={v.quote} delay={0.05 * i}>
            <TiltFrame tilt={v.tilt}>
              <article
                className='flex h-full flex-col rounded-[1.75rem] px-6 py-7 shadow-[0_16px_48px_rgba(0,0,0,0.25)]'
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 100%)',
                  borderTop: `4px solid ${v.accent}`,
                }}
              >
                <div className='flex items-center gap-3'>
                  <span
                    className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md'
                    style={{ backgroundColor: v.accent }}
                    aria-hidden
                  >
                    {v.initial}
                  </span>
                  <div className='min-w-0 text-left'>
                    <p className='text-sm font-bold text-[#1a1a1a]'>{v.who}</p>
                    <p className='text-[11px] font-semibold' style={{ color: v.accent }}>
                      {v.tag}
                    </p>
                  </div>
                </div>
                <p className='mt-5 flex-1 text-[15px] font-semibold leading-[1.85] text-[#1a1a1a]'>
                  「{v.quote}」
                </p>
              </article>
            </TiltFrame>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
