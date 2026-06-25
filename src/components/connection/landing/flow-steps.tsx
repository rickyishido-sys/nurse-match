import { LandingSectionTitle, LP_GOLD } from '@/components/connection/landing/landing-ui';

const STEPS = [
  {
    step: '01',
    icon: '✎',
    title: '参加登録',
    body: <>プロフィールと、あなたが求めるConnectionを登録。</>,
  },
  {
    step: '02',
    icon: '♡',
    title: 'イベントに申請',
    body: <>気になるConnection Eventに参加希望を送る。</>,
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
    body: <>イベント後も、参加者同士がつながり、新たなConnectionが生まれていく。</>,
  },
] as const;

export function LandingFlowSteps() {
  return (
    <section className='space-y-8 py-2'>
      <LandingSectionTitle kicker='体験の流れ' title='あなたの新しいつながりが生まれるまで' />

      <div className='-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        <ol className='flex min-w-max items-start gap-1'>
          {STEPS.map((item, index) => (
            <li key={item.step} className='flex items-start'>
              <div className='flex w-[92px] flex-col items-center text-center'>
                <p className='text-xs font-semibold tracking-wider' style={{ color: LP_GOLD }}>
                  {item.step}
                </p>
                <div
                  className='mt-2 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white text-base shadow-sm'
                  style={{ borderColor: `${LP_GOLD}99` }}
                >
                  {item.icon}
                </div>
                <p className='mt-3 text-[11px] font-semibold leading-snug text-[#1a1a1a]'>{item.title}</p>
                <p className='mt-2 text-[9px] leading-[1.65] text-[#6b6b6b]'>{item.body}</p>
              </div>
              {index < STEPS.length - 1 ? (
                <span className='mt-8 px-0.5 text-sm text-[#c5a059]/70' aria-hidden>
                  ›
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
