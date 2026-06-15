import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, CycleDiagram } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { CYCLE_STEPS, VISION_MATH } from '@/lib/hanakai/data';

const NOT_THIS = [
  { title: '花会は、花教室ではありません', body: '上手にいけることがゴールではありません。花はあくまで、人と出会い直すための入り口です。' },
  { title: 'SNSのように繋がるだけでもありません', body: 'タイムラインで繋がっても、体験の共有は生まれにくい。フォロー数より、また会いたい人を大切にします。' },
];

const IS_THIS = [
  { icon: '🌿', title: '新しいコミュニケーションの形', body: '花を軸に、利害や肩書きを越えて、良質なコミュニケーションが生まれる場をつくります。' },
  { icon: '🤝', title: '体験を共有する関係', body: '同じ時間に手を動かし、語らう。共有された体験が、続く関係の土台になります。' },
  { icon: '💛', title: '応援でつながる経済圏', body: '見た目や人気ではなく、夢・挑戦・活動への共感で応援する。応援の約80%が本人に届く設計です。' },
];

export default async function ConceptPage() {
  const viewer = await getHanakaiViewer();
  const yen = (n: number) => n.toLocaleString('ja-JP');

  return (
    <HanakaiShell viewer={viewer}>
      <section className='space-y-6'>
        <div>
          <p className='text-xs font-semibold tracking-[0.3em] text-[#caa66a]'>CONCEPT</p>
          <h1 className='mt-1 text-xl font-bold text-slate-800'>花会28万人構想</h1>
          <p className='mt-2 text-sm leading-7 text-slate-600'>
            リアルの花会を起点に、デジタルで想いを知り、またリアルで会う。
            この循環を全国に広げ、花を軸にした新しいコミュニケーションを年間28万人へ届けることを目指します。
          </p>
        </div>

        {/* 循環図 */}
        <div>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>「リアル → デジタル → リアル」の循環</h2>
          <CycleDiagram steps={CYCLE_STEPS} />
        </div>

        {/* 花会ではないもの */}
        <div className='space-y-3'>
          <h2 className='text-sm font-bold text-slate-800'>花会が「めざさないもの」</h2>
          {NOT_THIS.map((item) => (
            <Card key={item.title}>
              <p className='text-sm font-bold text-slate-800'>
                <span className='mr-1 text-rose-400'>✕</span>
                {item.title}
              </p>
              <p className='mt-1 text-xs leading-6 text-slate-600'>{item.body}</p>
            </Card>
          ))}
        </div>

        {/* 花会がめざすもの */}
        <div className='space-y-3'>
          <h2 className='text-sm font-bold text-slate-800'>花会が「めざすもの」</h2>
          {IS_THIS.map((item) => (
            <Card key={item.title}>
              <div className='flex items-start gap-3'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ea] text-xl'>{item.icon}</div>
                <div>
                  <p className='text-sm font-bold text-slate-800'>{item.title}</p>
                  <p className='mt-1 text-xs leading-6 text-slate-600'>{item.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 28万人の数字根拠 */}
        <div>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>28万人構想の数字根拠</h2>
          <Card className='bg-[#f7faf5]'>
            <ul className='space-y-2 text-sm text-slate-700'>
              <li className='flex items-center justify-between'>
                <span className='text-slate-600'>1拠点で月4回の花会</span>
                <span className='font-bold text-[#4f7a4a]'>月{VISION_MATH.perBaseMonthly}回</span>
              </li>
              <li className='flex items-center justify-between'>
                <span className='text-slate-600'>1回あたりの参加</span>
                <span className='font-bold text-[#4f7a4a]'>{VISION_MATH.perEvent}名</span>
              </li>
              <li className='flex items-center justify-between border-t border-[#e3ebdd] pt-2'>
                <span className='text-slate-600'>1拠点 年間（4回 × 12ヶ月 × 6名）</span>
                <span className='font-bold text-[#4f7a4a]'>{yen(VISION_MATH.perBaseYearly)}名</span>
              </li>
              <li className='flex items-center justify-between'>
                <span className='text-slate-600'>全国の拠点数</span>
                <span className='font-bold text-[#4f7a4a]'>{yen(VISION_MATH.bases)}拠点</span>
              </li>
            </ul>
            <div className='mt-3 rounded-2xl bg-white p-4 text-center'>
              <p className='text-xs text-slate-500'>1000拠点 × 年間288名</p>
              <p className='mt-1 text-3xl font-bold tracking-tight text-[#3f6b3b]'>
                年間 {yen(VISION_MATH.total)}<span className='text-base font-bold text-slate-500'>名</span>
              </p>
              <p className='mt-1 text-[11px] text-slate-400'>= 花会28万人構想</p>
            </div>
          </Card>
        </div>

        <Link href='/register' className='flex h-12 items-center justify-center rounded-2xl bg-[#4f7a4a] text-sm font-bold text-white'>
          この循環に参加する
        </Link>
      </section>
    </HanakaiShell>
  );
}
