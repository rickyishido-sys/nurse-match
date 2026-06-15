import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip, ProgressBar } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  formatYen,
  getUser,
  listSupportProjects,
  SUPPORT_CATEGORY_LABEL,
  THROW_FLOWER_TIERS,
} from '@/lib/hanakai/data';

const DREAM_EXAMPLES = [
  { icon: '🎓', label: '花会講師になりたい' },
  { icon: '🏡', label: '地域花会を立ち上げたい' },
  { icon: '🌷', label: '花屋を開きたい' },
  { icon: '📚', label: '花を学びたい' },
  { icon: '👨‍👩‍👧', label: '親子花会を開催したい' },
];

export default async function SupportPage() {
  const viewer = await getHanakaiViewer();
  const projects = listSupportProjects();
  const totalRaised = projects.reduce((sum, p) => sum + p.raisedAmount, 0);
  const totalSupporters = projects.reduce((sum, p) => sum + p.supporterCount, 0);

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-6'>
        {/* ヒーロー: 応援経済圏 */}
        <section className='rounded-3xl bg-gradient-to-br from-[#f6efdf] to-[#fbeef0] p-5'>
          <p className='text-xs font-semibold tracking-[0.2em] text-[#9b7d3f]'>応援経済圏</p>
          <h1 className='mt-1 text-lg font-bold text-slate-800'>夢や挑戦を、花で応援する。</h1>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            TikTokのように見た目や人気に投げるのではなく、<strong className='text-[#9b7d3f]'>夢・挑戦・活動への共感</strong>で応援する。
            応援（投げ花）の<strong className='text-[#9b7d3f]'>約80%が本人に届く</strong>設計です。
          </p>
          <div className='mt-3 flex gap-2'>
            <div className='flex-1 rounded-2xl bg-white/70 p-2 text-center'>
              <p className='text-base font-bold text-[#9b7d3f]'>{formatYen(totalRaised)}</p>
              <p className='text-[10px] text-slate-500'>これまでの応援額</p>
            </div>
            <div className='flex-1 rounded-2xl bg-white/70 p-2 text-center'>
              <p className='text-base font-bold text-[#9b7d3f]'>{totalSupporters}人</p>
              <p className='text-[10px] text-slate-500'>応援した仲間</p>
            </div>
          </div>
        </section>

        {/* 投げ花メニュー紹介 */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>投げ花で応援する</h2>
          <div className='grid grid-cols-2 gap-2'>
            {THROW_FLOWER_TIERS.map((tier) => (
              <div key={tier.id} className='rounded-2xl border border-[#e0d4b6] bg-white p-3'>
                <p className='text-lg'>{tier.emoji}</p>
                <p className='text-xs font-bold text-slate-800'>{tier.label}</p>
                <p className='text-sm font-bold text-[#9b7d3f]'>¥{tier.amount.toLocaleString('ja-JP')}</p>
                <p className='text-[10px] leading-4 text-slate-500'>{tier.note}</p>
              </div>
            ))}
          </div>
          <p className='mt-2 text-[11px] leading-5 text-slate-500'>各挑戦のページから投げ花を贈れます（決済は準備中のモックです）。</p>
        </section>

        {/* 応援できる対象 */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>こんな夢・挑戦を応援できます</h2>
          <div className='flex flex-wrap gap-2'>
            {DREAM_EXAMPLES.map((d) => (
              <span key={d.label} className='inline-flex items-center gap-1 rounded-full bg-[#f5f8f3] px-3 py-1.5 text-xs text-slate-600'>
                <span>{d.icon}</span>
                {d.label}
              </span>
            ))}
          </div>
        </section>

        {/* 挑戦一覧 */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>応援を募集している挑戦</h2>
          <div className='space-y-3'>
            {projects.map((project) => {
              const owner = getUser(project.ownerId);
              return (
                <Link key={project.id} href={`/support/${project.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
                  <div className='relative h-32 w-full'>
                    <Image src={project.coverUrl} alt={project.title} fill className='object-cover' />
                    <div className='absolute left-2 top-2'><Chip tone='gold'>{SUPPORT_CATEGORY_LABEL[project.category]}</Chip></div>
                  </div>
                  <div className='space-y-2 p-3'>
                    <p className='text-sm font-semibold text-slate-800'>{project.title}</p>
                    <p className='text-xs text-slate-500'>{owner?.nickname}・{project.supporterCount}人が応援</p>
                    <ProgressBar value={project.raisedAmount} max={project.goalAmount} />
                    <p className='text-[11px] text-slate-500'>{formatYen(project.raisedAmount)} / {formatYen(project.goalAmount)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>応援の考え方</h2>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            応援は「投げ銭」ではなく「投げ花」。一輪の花を手渡すように、その人の挑戦に共感を贈ります。
            集まった応援の約80%が本人に届き、夢の実現を後押しします。
          </p>
        </Card>
      </div>
    </HanakaiShell>
  );
}
