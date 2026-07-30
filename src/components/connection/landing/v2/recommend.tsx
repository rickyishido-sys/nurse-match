'use client';

import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { SnapCarousel } from '@/components/connection/landing/v2/carousel';

const ITEMS = [
  { emoji: '💬', text: '普段会わない人と、体験を共有してみたい', accent: HK.coral, tilt: -3 },
  { emoji: '🌿', text: '仕事以外の、新しいつながりが欲しい', accent: HK.lime, tilt: 4 },
  { emoji: '🎨', text: '趣味や体験を通じて、自然につながりたい', accent: HK.violet, tilt: -2 },
  { emoji: '🚪', text: '一人でも気軽に参加できる場所がほしい', accent: HK.sky, tilt: 5 },
  { emoji: '🤝', text: '同性・異性を問わず、新しい人間関係を作りたい', accent: HK.amber, tilt: -4 },
  { emoji: '📱', text: 'SNSではなく、リアルで人と会いたい', accent: HK.coral, tilt: 3 },
] as const;

export function LandingRecommend() {
  return (
    <Section tone='cream' className='relative overflow-hidden !bg-gradient-to-br from-[#fff5f0] via-[#faf7f2] to-[#f0f5ff]'>
      <ColorBlob color={HK.amberSoft} className='right-[-6%] top-[8%]' />
      <ColorBlob color={HK.skySoft} className='left-[-4%] bottom-[12%]' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 04</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>こんな方におすすめ</Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1} className='relative z-10 mx-auto mt-12 max-w-[640px]'>
        <SnapCarousel
          ariaLabel='こんな方におすすめ'
          items={ITEMS.map((item) => (
            <TiltFrame key={item.text} tilt={item.tilt}>
              <div
                className='flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] px-8 py-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
                style={{
                  background: `linear-gradient(145deg, ${item.accent}18 0%, white 55%)`,
                  borderLeft: `5px solid ${item.accent}`,
                }}
              >
                <span className='text-5xl' aria-hidden>
                  {item.emoji}
                </span>
                <p className='mt-7 max-w-[22ch] text-lg font-bold leading-[1.75] text-[#1a1a1a]'>
                  {item.text}
                </p>
              </div>
            </TiltFrame>
          ))}
        />
      </Reveal>
    </Section>
  );
}
