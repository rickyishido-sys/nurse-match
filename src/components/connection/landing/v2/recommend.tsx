'use client';

import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { SnapCarousel } from '@/components/connection/landing/v2/carousel';

const ITEMS = [
  { emoji: '💬', text: '普段出会わない人と、話してみたい' },
  { emoji: '🌿', text: '仕事以外の、新しいつながりが欲しい' },
  { emoji: '🎨', text: '趣味や体験を通じて、自然に出会いたい' },
  { emoji: '🚪', text: '一人でも気軽に参加できる場所がほしい' },
  { emoji: '🤝', text: '同性・異性を問わず、新しい人間関係を作りたい' },
  { emoji: '📱', text: 'SNSではなく、リアルで人と会いたい' },
];

export function LandingRecommend() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 04</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>こんな方におすすめ</Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1} className='mx-auto mt-12 max-w-[620px]'>
        <SnapCarousel
          ariaLabel='こんな方におすすめ'
          items={ITEMS.map((item) => (
            <div
              key={item.text}
              className='flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-[#ece3d4] bg-white px-8 py-12 text-center shadow-[0_8px_30px_rgba(26,26,26,0.05)]'
            >
              <span className='text-5xl' aria-hidden>
                {item.emoji}
              </span>
              <p className='mt-7 max-w-[22ch] text-lg font-semibold leading-[1.8] text-[#1a1a1a]'>
                {item.text}
              </p>
            </div>
          ))}
        />
      </Reveal>
    </Section>
  );
}
