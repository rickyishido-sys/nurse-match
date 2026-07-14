'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { ctaPrimary, ctaSecondary } from '@/components/connection/ui/cta-classes';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const STEPS = [
  {
    step: '01',
    title: '体験を選ぶ',
    body: '花・カフェ・散歩など、気分に合った体験を選ぶだけ。難しい手続きはありません。',
    img: '/flow/register.png',
    tilt: -4,
    accent: HK.coral,
    char: 'W' as const,
  },
  {
    step: '02',
    title: '参加する',
    body: 'リアルな場所に行くだけ。運営がグループづくりや当日の案内をサポートします。',
    img: '/flow/apply.png',
    tilt: 3,
    accent: HK.violet,
    char: 'E1' as const,
  },
  {
    step: '03',
    title: '体験に参加する',
    body: '主催者または運営が申請を確認します。承認後、当日はリアルな場所で体験に参加できます。必要なら参加をキャンセルできます。',
    img: '/flow/continue.png',
    tilt: -2,
    accent: HK.amber,
    char: 'S' as const,
  },
] as const;

export function LandingHowItWorks({ joinHref = '/register' }: { joinHref?: string }) {
  return (
    <Section tone='cream' id='how-it-works' className='relative overflow-hidden !bg-gradient-to-b from-[#fff8f5] via-[#faf7f2] to-[#f5f0ff]'>
      <ColorBlob color={HK.blush} className='left-[-5%] top-[10%]' />
      <ColorBlob color={HK.skySoft} className='right-[-3%] bottom-[15%]' />

      <div className='relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left'>
        <Reveal>
          <Kicker>How it works</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>
            参加まで、
            <span className='hk-text-gradient'> 3ステップ</span>
          </Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[40ch]'>
            正方形に並べた説明ではなく、体験の流れそのものをデザイン。
            あなたは「来る」だけでOKです。
          </Lead>
        </Reveal>
      </div>

      <div className='relative z-10 mt-16 space-y-10 lg:space-y-0'>
        {STEPS.map((item, index) => (
          <Reveal key={item.title} delay={0.1 * index}>
            <div
              className={`flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <TiltFrame tilt={item.tilt} className='relative mx-auto w-full max-w-[320px] shrink-0 lg:mx-0 lg:w-[38%]'>
                <div
                  className='relative overflow-visible rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(26,26,26,0.1)]'
                  style={{ background: `linear-gradient(145deg, ${item.accent}18, white)` }}
                >
                  <BrandCharacterSlot
                    id={item.char}
                    size='sm'
                    variant='peek'
                    wrapperClassName='absolute -right-4 -top-4'
                  />
                  <div className='relative mx-auto h-32 w-32'>
                    <Image src={item.img} alt='' fill sizes='128px' className='object-contain' />
                  </div>
                  <p className='mt-4 text-center text-[11px] font-bold tracking-[0.24em]' style={{ color: item.accent }}>
                    STEP {item.step}
                  </p>
                </div>
              </TiltFrame>

              <div className={`flex-1 text-center lg:text-left ${index % 2 === 1 ? 'lg:text-right' : ''}`}>
                <h3 className='font-serif text-2xl font-bold text-[#1a1a1a] sm:text-[1.75rem]'>{item.title}</h3>
                <p className='mt-3 text-sm leading-[1.95] text-[#5a5247] sm:text-base'>{item.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.35}>
        <div className='relative z-10 mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start'>
          <Link href='/events' className={`${ctaPrimary} min-w-[200px]`}>
            イベントを見る
          </Link>
          <Link
            href='/events/create'
            className={`${ctaSecondary} min-w-[200px] border-[#e85d4c] text-[#e85d4c] hover:bg-[#fff5f3]`}
            style={{ borderColor: HK.coral, color: HK.coral }}
          >
            イベントを作る
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
