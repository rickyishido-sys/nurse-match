'use client';

import Image from 'next/image';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const STORY = [
  { img: '/categories/flower.png', label: '花を作る' },
  { img: '/categories/cafe.png', label: '会話する' },
  { img: '/flow/matching.png', label: '仲間になる' },
  { img: '/flow/continue.png', label: 'また会う' },
];

export function LandingAbout() {
  return (
    <Section tone='white'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 01</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>花会とは</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[40ch]'>
            花会は、花教室ではありません。
            <br />
            花を通して人と出会い、会話し、仲間をつくるコミュニティです。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <ol className='mx-auto mt-14 grid max-w-[760px] grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 sm:gap-x-2'>
          {STORY.map((item, i) => (
            <li key={item.label} className='relative flex flex-col items-center'>
              <div className='relative h-24 w-24 sm:h-28 sm:w-28'>
                <Image src={item.img} alt={item.label} fill sizes='112px' className='object-contain' />
              </div>
              <p className='mt-4 text-sm font-semibold text-[#1a1a1a]'>{item.label}</p>
              {i < STORY.length - 1 ? (
                <span
                  className='pointer-events-none absolute right-[-12px] top-[44px] hidden text-lg sm:block'
                  style={{ color: HK.gold }}
                  aria-hidden
                >
                  ›
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
