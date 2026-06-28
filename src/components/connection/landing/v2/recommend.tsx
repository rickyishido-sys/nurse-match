'use client';

import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { SnapCarousel } from '@/components/connection/landing/v2/carousel';

const ITEMS = [
  { emoji: '🌱', text: '大人になってから、友達が減ったと感じる' },
  { emoji: '🤝', text: '趣味を通じて、新しい仲間をつくりたい' },
  { emoji: '🚪', text: '一人でも気軽に参加できる場所がほしい' },
  { emoji: '📱', text: 'SNSだけの関係に、少し疲れてしまった' },
  { emoji: '🌸', text: '花が好き。好きなものでつながりたい' },
  { emoji: '✨', text: '日々の暮らしを、もっと豊かにしたい' },
];

export function LandingRecommend() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 03</Kicker>
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
