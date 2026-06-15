import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { CoinWalletCard } from '@/components/hanakai/cheer';
import { Card, Chip, ProgressBar } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  CHEER_TIERS,
  formatCoin,
  getUser,
  getWallet,
  listSupportProjects,
  SUPPORT_CATEGORY_LABEL,
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
  const wallet = getWallet();
  const projects = listSupportProjects();
  const totalRaised = projects.reduce((sum, p) => sum + p.raisedCoins, 0);
  const totalSupporters = projects.reduce((sum, p) => sum + p.supporterCount, 0);

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-6'>
        {/* ヒーロー: 応援経済圏 */}
        <section className='rounded-3xl bg-gradient-to-br from-[#eef4ea] to-[#fbeef0] p-5'>
          <p className='text-xs font-semibold tracking-[0.2em] text-[#4f7a4a]'>応援経済圏</p>
          <h1 className='mt-1 text-lg font-bold text-slate-800'>夢や挑戦を、コインで応援する。</h1>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            花会コインで応援すると、画面に<strong className='text-[#4f7a4a]'>花が咲きます</strong>。
            見た目や人気ではなく、<strong className='text-[#4f7a4a]'>夢・挑戦・活動への共感</strong>を贈る応援経済圏です。
          </p>
          <div className='mt-3 flex gap-2'>
            <div className='flex-1 rounded-2xl bg-white/70 p-2 text-center'>
              <p className='text-base font-bold text-[#9b7d3f]'>{formatCoin(totalRaised)}</p>
              <p className='text-[10px] text-slate-500'>これまでの応援</p>
            </div>
            <div className='flex-1 rounded-2xl bg-white/70 p-2 text-center'>
              <p className='text-base font-bold text-[#9b7d3f]'>{totalSupporters}人</p>
              <p className='text-[10px] text-slate-500'>応援した仲間</p>
            </div>
          </div>
        </section>

        {/* 保有コイン & チャージ */}
        <CoinWalletCard initialBalance={wallet.balance} />

        {/* 応援メニュー（コイン → 花の演出） */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>応援メニュー</h2>
          <div className='grid grid-cols-5 gap-1.5'>
            {CHEER_TIERS.map((tier) => (
              <div key={tier.id} className='rounded-2xl border border-[#e0d4b6] bg-white p-2 text-center'>
                <p className='text-xl'>{tier.emoji}</p>
                <p className='text-[11px] font-bold text-[#9b7d3f]'>{tier.coins.toLocaleString('ja-JP')}</p>
                <p className='text-[9px] leading-3 text-slate-500'>Coin</p>
              </div>
            ))}
          </div>
          <p className='mt-2 text-[11px] leading-5 text-slate-500'>各挑戦のページで「💛 応援する」を押すと、コインに応じた花が咲きます。</p>
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

        {/* 応援プロジェクト一覧 */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>応援プロジェクト</h2>
          <div className='space-y-3'>
            {projects.map((project) => {
              const owner = getUser(project.ownerId);
              const pct = Math.min(100, Math.round((project.raisedCoins / Math.max(1, project.goalCoins)) * 100));
              return (
                <Link key={project.id} href={`/support/${project.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
                  <div className='relative h-32 w-full'>
                    <Image src={project.coverUrl} alt={project.title} fill className='object-cover' />
                    <div className='absolute left-2 top-2'><Chip tone='gold'>{SUPPORT_CATEGORY_LABEL[project.category]}</Chip></div>
                    <div className='absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#4f7a4a]'>{pct}%</div>
                  </div>
                  <div className='space-y-2 p-3'>
                    <p className='text-sm font-semibold text-slate-800'>{project.title}</p>
                    <p className='text-xs text-slate-500'>{owner?.nickname}・{project.supporterCount}名が応援</p>
                    <ProgressBar value={project.raisedCoins} max={project.goalCoins} />
                    <p className='text-[11px] text-slate-500'>{formatCoin(project.raisedCoins)} / 目標 {formatCoin(project.goalCoins)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>応援の考え方</h2>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            応援は花会コインで行い、その応援は花として可視化されます。一輪の花を手渡すように、その人の夢や挑戦に共感を贈る。
            それがHANAKAIの応援経済圏です。
          </p>
        </Card>
      </div>
    </HanakaiShell>
  );
}
