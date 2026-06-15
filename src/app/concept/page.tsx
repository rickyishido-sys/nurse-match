import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const steps = [
  { icon: '🌿', title: 'リアル花会', body: '花をいけ、同じ時間を過ごし、その場の人と語らう。体験から関係が生まれます。' },
  { icon: '📱', title: 'デジタルコミュニティ', body: '作品や想いを投稿し、人柄を知る。気になる人を応援し、つながりが続きます。' },
  { icon: '🤝', title: 'またリアルへ', body: '価値観の合う人と、また花会で会う。循環するほど関係性は深まります。' },
];

export default async function ConceptPage() {
  const viewer = await getHanakaiViewer();
  return (
    <HanakaiShell viewer={viewer}>
      <section className='space-y-5'>
        <div>
          <p className='text-xs font-semibold tracking-[0.3em] text-[#caa66a]'>CONCEPT</p>
          <h1 className='mt-1 text-xl font-bold text-slate-800'>花会28万人構想</h1>
          <p className='mt-2 text-sm leading-7 text-slate-600'>
            花会は、花教室ではありません。SNSのようにただ繋がるだけでもありません。
            リアルの体験を起点に、関係性がゆっくり深まる新しいコミュニケーションの形を目指します。
          </p>
        </div>

        <div className='space-y-3'>
          {steps.map((step, idx) => (
            <Card key={step.title}>
              <div className='flex items-start gap-3'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ea] text-xl'>{step.icon}</div>
                <div>
                  <p className='text-sm font-bold text-slate-800'>
                    <span className='mr-1 text-[#caa66a]'>0{idx + 1}</span>
                    {step.title}
                  </p>
                  <p className='mt-1 text-xs leading-6 text-slate-600'>{step.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>応援は、共感で。</h2>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            かわいい人に投げるのではなく、夢・挑戦・活動への共感で応援する。
            応援（投げ花）は、その大部分が本人に届く設計を目指しています。
          </p>
        </Card>

        <Link href='/register' className='flex h-12 items-center justify-center rounded-2xl bg-[#4f7a4a] text-sm font-bold text-white'>
          花会をはじめる
        </Link>
      </section>
    </HanakaiShell>
  );
}
