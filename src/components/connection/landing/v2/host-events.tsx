'use client';

import Link from 'next/link';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const HOST_STEPS = [
  {
    step: '01',
    title: 'テーマを決める',
    body: '花を愛でる会、お茶をする会、散歩クラブ——あなたの「やってみたい」をそのまま形にできます。',
    accent: HK.coral,
    tilt: -3,
    char: 'D1' as const,
  },
  {
    step: '02',
    title: '日時と場所を設定',
    body: 'アプリから体験の内容・日時・定員を入力するだけ。難しい準備は必要ありません。',
    accent: HK.violet,
    tilt: 4,
    char: 'E2' as const,
  },
  {
    step: '03',
    title: '参加者を確認する',
    body: '申請者を確認し、当日はリアルな体験として場を整えます。イベントの編集・中止もアプリから行えます。',
    accent: HK.amber,
    tilt: -2,
    char: 'Y' as const,
  },
] as const;

export function LandingHostEvents() {
  return (
    <Section
      tone='white'
      id='host-events'
      className='relative overflow-hidden !bg-gradient-to-br from-[#fff5f0] via-white to-[#f5f0ff]'
    >
      <ColorBlob color={HK.coralSoft} className='right-[-4%] top-[8%]' />
      <ColorBlob color={HK.violetSoft} className='left-[-5%] bottom-[12%]' />

      <BrandCharacterSlot id='A' size='lg' variant='peek' className='rotate-8' wrapperClassName='absolute -right-4 top-[10%] hidden sm:block' />

      <div className='relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left'>
        <Reveal>
          <Kicker>イベントを作る</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>
            あなたの趣味や、
            <br className='sm:hidden' />
            <span className='hk-text-gradient'>やりたいこと</span>をここで実現
          </Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[48ch]'>
            HANAKAIは参加者だけの場所ではありません。
            誰かがイベントを作ってくれるから、みんなの出会いが生まれます。
            あなたも主催者の一人になれます。
          </Lead>
        </Reveal>
      </div>

      <div className='relative z-10 mt-14 grid gap-6 sm:grid-cols-3 sm:gap-7 lg:gap-8'>
        {HOST_STEPS.map((item, i) => (
          <Reveal key={item.title} delay={0.08 * i}>
            <TiltFrame tilt={item.tilt} className='h-full w-full'>
              <div
                className='relative flex h-full min-h-[200px] flex-col rounded-[2rem] px-6 py-8 shadow-[0_16px_48px_rgba(26,26,26,0.08)] sm:min-h-[220px] sm:px-7 sm:py-9'
                style={{ background: `linear-gradient(160deg, ${item.accent}16, white 65%)` }}
              >
                <BrandCharacterSlot
                  id={item.char}
                  size='xs'
                  variant='peek'
                  wrapperClassName='absolute -right-2 -top-3'
                />
                <p className='text-[11px] font-bold tracking-[0.24em]' style={{ color: item.accent }}>
                  STEP {item.step}
                </p>
                <h3 className='mt-3 font-serif text-xl font-bold text-[#1a1a1a]'>{item.title}</h3>
                <p className='mt-3 flex-1 text-sm leading-[1.9] text-[#5a5247]'>{item.body}</p>
              </div>
            </TiltFrame>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <div className='relative z-10 mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start'>
          <Link href='/events' className={`${ctaPrimary} min-w-[200px]`}>
            イベントを見る
          </Link>
          <Link
            href='/events/create'
            className='hk-brand-btn inline-flex min-h-11 min-w-[200px] items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 active:scale-[0.98]'
            style={{ background: HK.coral }}
          >
            イベントを作る
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
