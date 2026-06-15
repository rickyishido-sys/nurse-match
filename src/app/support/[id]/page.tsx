import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { CheerButton } from '@/components/hanakai/cheer';
import { Card, Chip, ProgressBar } from '@/components/hanakai/ui';
import { formatCoin, getSupportProject, getUser, getWallet, SUPPORT_CATEGORY_LABEL } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = getSupportProject(id);
  if (!project) notFound();

  const viewer = await getHanakaiViewer();
  const wallet = getWallet();
  const owner = getUser(project.ownerId);
  const pct = Math.min(100, Math.round((project.raisedCoins / Math.max(1, project.goalCoins)) * 100));

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <div className='relative h-44 w-full overflow-hidden rounded-3xl'>
          <Image src={project.coverUrl} alt={project.title} fill className='object-cover' priority />
        </div>

        <Chip tone='gold'>{SUPPORT_CATEGORY_LABEL[project.category]}</Chip>
        <h1 className='text-lg font-bold text-slate-800'>{project.title}</h1>
        {owner ? (
          <Link href={`/members/${owner.id}`} className='inline-flex items-center gap-2'>
            <div className='relative h-7 w-7 overflow-hidden rounded-full'>
              <Image src={owner.avatarUrl} alt={owner.nickname} fill className='object-cover' />
            </div>
            <span className='text-sm text-slate-600'>{owner.nickname}</span>
          </Link>
        ) : null}

        <p className='text-sm leading-6 text-slate-600'>{project.summary}</p>

        {/* 進捗（コインベース） */}
        <Card>
          <div className='mb-2 flex items-end justify-between'>
            <div>
              <p className='text-[11px] text-slate-500'>現在の応援</p>
              <p className='text-2xl font-bold text-[#9b7d3f]'>{formatCoin(project.raisedCoins)}</p>
            </div>
            <p className='text-2xl font-bold text-[#4f7a4a]'>{pct}%</p>
          </div>
          <ProgressBar value={project.raisedCoins} max={project.goalCoins} />
          <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
            <span>目標 {formatCoin(project.goalCoins)}</span>
            <span>{project.supporterCount}名が応援</span>
          </div>
        </Card>

        <Card>
          <h2 className='mb-1 text-sm font-bold text-slate-800'>挑戦のストーリー</h2>
          <p className='text-sm leading-7 text-slate-600'>{project.story}</p>
        </Card>

        <Card className='bg-[#f7faf5]'>
          <p className='text-xs leading-6 text-slate-600'>
            応援は花会コインで行い、画面に花として咲きます。あなたの共感が、この挑戦の背中を押します。
          </p>
          <p className='mt-2 text-[11px] font-semibold text-[#9b7d3f]'>保有コイン {wallet.balance.toLocaleString('ja-JP')} Coin</p>
        </Card>

        {/* 応援する（コイン → 花の演出） */}
        <div className='sticky bottom-20 z-10'>
          <CheerButton initialBalance={wallet.balance} targetTitle={project.title} />
        </div>
      </article>
    </HanakaiShell>
  );
}
