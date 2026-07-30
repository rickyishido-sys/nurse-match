import Image from 'next/image';
import { LandingSectionTitle, LP_GOLD } from '@/components/connection/landing/landing-ui';

const STEPS = [
  {
    step: '01',
    img: '/flow/register.png',
    title: '参加登録',
    body: 'プロフィールと、あなたが求めるConnectionを登録。',
  },
  {
    step: '02',
    img: '/flow/apply-browse.png',
    title: 'イベントに申請',
    body: '気になるConnection Eventに参加希望を送る。',
  },
  {
    step: '03',
    img: '/flow/experience-enjoy.png',
    title: '体験を楽しむ',
    body: '花・カフェ・散歩など、選んだ体験を思いきり楽しむ。終わったあとに「また参加したい」と思える休日の余韻がHANAKAIの中心です。',
  },
  {
    step: '04',
    img: '/flow/continue.png',
    title: 'Connectionが続いていく',
    body: 'イベント後も、参加者同士がつながり、新たなConnectionが生まれていく。',
  },
] as const;

export function LandingFlowSteps() {
  return (
    <section className='space-y-6 lg:space-y-8'>
      <LandingSectionTitle kicker='体験の流れ' title='あなたの新しいつながりが生まれるまで' />

      {/* Mobile / Tablet: 縦並び */}
      <ol className='space-y-5 lg:hidden'>
        {STEPS.map((item) => (
          <li key={item.step} className='flex gap-4 [&:last-child>div]:border-b-0 [&:last-child>div]:pb-0'>
            <div className='flex shrink-0 flex-col items-center'>
              <p className='text-[10px] font-semibold tracking-wider' style={{ color: LP_GOLD }}>
                {item.step}
              </p>
              <div className='relative mt-1.5 h-16 w-16'>
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes='64px'
                  className='object-contain'
                />
              </div>
            </div>
            <div className='min-w-0 flex-1 border-b border-[#ebe5dc] pb-5'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
              <p className='mt-1.5 text-xs leading-6 text-[#6b6b6b]'>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* PC: 横並び */}
      <ol className='hidden grid-cols-4 gap-4 lg:grid'>
        {STEPS.map((item) => (
          <li key={item.step} className='flex flex-col items-center text-center'>
            <p className='text-xs font-semibold tracking-wider' style={{ color: LP_GOLD }}>
              {item.step}
            </p>
            <div className='relative mt-3 h-24 w-24'>
              <Image
                src={item.img}
                alt={item.title}
                fill
                sizes='96px'
                className='object-contain'
              />
            </div>
            <p className='mt-3 text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
            <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
