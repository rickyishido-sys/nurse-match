'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const STEPS = [
  {
    step: '01',
    title: 'プロフィール作成',
    body: '興味や価値観を登録。あなたに合うConnectionを見つける準備をします。',
    img: '/flow/register.png',
  },
  {
    step: '02',
    title: 'イベント参加',
    body: '花・コーヒー・散歩など、気になる体験に参加申請。リアルで出会います。',
    img: '/flow/apply.png',
  },
  {
    step: '03',
    title: 'Connectionが始まる',
    body: 'イベント後は参加者だけのページで交流。フォローやメッセージでつながりが育ちます。',
    img: '/flow/continue.png',
  },
] as const;

export function LandingHowItWorks({ joinHref = '/register' }: { joinHref?: string }) {
  return (
    <Section tone='cream' id='how-it-works'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>How it works</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>参加までの流れ</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[40ch]'>
            難しい手続きはありません。プロフィールを作って、イベントに参加するだけ。
            あとは自然に、Connectionが始まります。
          </Lead>
        </Reveal>
      </div>

      <div className='mt-14 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6'>
        {STEPS.map((item, index) => (
          <Reveal key={item.title} delay={0.08 * index}>
            <div className='relative flex h-full flex-col items-center rounded-[2rem] border border-[#ece3d4] bg-white px-6 py-8 text-center shadow-[0_8px_30px_rgba(26,26,26,0.04)] sm:px-8'>
              {index < STEPS.length - 1 ? (
                <span
                  className='pointer-events-none absolute -bottom-4 left-1/2 hidden -translate-x-1/2 text-2xl text-[#d8c39a] lg:hidden'
                  aria-hidden
                >
                  ↓
                </span>
              ) : null}
              <div className='relative h-28 w-28 sm:h-32 sm:w-32'>
                <Image src={item.img} alt='' fill sizes='128px' className='object-contain' />
              </div>
              <p
                className='mt-5 text-[11px] font-bold tracking-[0.24em]'
                style={{ color: HK.gold }}
              >
                STEP {item.step}
              </p>
              <h3 className='mt-2 font-serif text-xl font-semibold text-[#1a1a1a]'>{item.title}</h3>
              <p className='mt-3 text-sm leading-[1.9] text-[#6b6b6b]'>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.25}>
        <div className='mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href={joinHref}
            className='flex h-12 min-w-[200px] items-center justify-center rounded-full bg-[#1f5d4f] px-8 text-sm font-semibold text-white shadow-md transition active:scale-[0.98]'
          >
            参加登録する
          </Link>
          <Link
            href='/events'
            className='flex h-12 min-w-[200px] items-center justify-center rounded-full border border-[#1a1a1a]/15 bg-white px-8 text-sm font-semibold text-[#1a1a1a] transition active:scale-[0.98]'
          >
            イベントを見る
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
