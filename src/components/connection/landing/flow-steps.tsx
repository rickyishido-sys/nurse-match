import { LandingSectionTitle, LP_GOLD } from '@/components/connection/landing/landing-ui';

const STEPS = [
  {
    step: '01',
    icon: '✎',
    title: '参加登録',
    body: 'プロフィールと、あなたが求めるConnectionを登録。',
  },
  {
    step: '02',
    icon: '♡',
    title: 'イベントに申請',
    body: '気になるConnection Eventに参加希望を送る。',
  },
  {
    step: '03',
    icon: '👥',
    title: '最適なConnectionが生まれる',
    body: (
      <>
        イベントごとに、運営が
        <span style={{ color: LP_GOLD }}>価値観</span>
        や
        <span style={{ color: LP_GOLD }}>興味関心</span>
        をもとに
        <span style={{ color: LP_GOLD }}>参加メンバー</span>
        を決定する。
      </>
    ),
  },
  {
    step: '04',
    icon: '🤝',
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
              <div
                className='mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border bg-[#fafaf8] text-sm'
                style={{ borderColor: `${LP_GOLD}66` }}
              >
                {item.icon}
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
            <div
              className='mt-2 flex h-12 w-12 items-center justify-center rounded-full border bg-white text-base shadow-sm'
              style={{ borderColor: `${LP_GOLD}99` }}
            >
              {item.icon}
            </div>
            <p className='mt-3 text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
            <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
