import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { LiveCheerPanel } from '@/components/hanakai/cheer';
import { Card, Chip } from '@/components/hanakai/ui';
import { formatCoin, getLive, getUser, getWallet, LIVE_CATEGORY_LABEL, listLiveCheerFeed } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LiveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const live = getLive(id);
  if (!live) notFound();

  const viewer = await getHanakaiViewer();
  const host = getUser(live.hostId);
  const wallet = getWallet();
  const feed = listLiveCheerFeed();
  const viewerName = viewer?.displayName ?? 'あなた';

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <div className='relative aspect-video w-full overflow-hidden rounded-3xl bg-black'>
          <Image src={live.coverUrl} alt={live.title} fill className='object-cover opacity-90' priority />
          <div className='absolute inset-0 flex items-center justify-center'>
            {live.isLiveNow ? (
              <span className='rounded-full bg-rose-500 px-4 py-1.5 text-sm font-bold text-white'>● LIVE 配信中</span>
            ) : (
              <span className='rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-slate-700'>配信前</span>
            )}
          </div>
        </div>

        <div className='space-y-1'>
          <Chip tone='gold'>{LIVE_CATEGORY_LABEL[live.category]}</Chip>
          <h1 className='text-lg font-bold text-slate-800'>{live.title}</h1>
          {host ? (
            <Link href={`/members/${host.id}`} className='inline-flex items-center gap-2'>
              <div className='relative h-7 w-7 overflow-hidden rounded-full'>
                <Image src={host.avatarUrl} alt={host.nickname} fill className='object-cover' />
              </div>
              <span className='text-sm text-slate-600'>{host.nickname}</span>
            </Link>
          ) : null}
        </div>

        <p className='text-sm leading-7 text-slate-600'>{live.description}</p>

        <Card className='bg-[#f7faf5]'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-slate-500'>集まった応援</p>
              <p className='text-lg font-bold text-[#9b7d3f]'>🌸 {formatCoin(live.cheerTotal)}</p>
            </div>
            <Chip tone='gold'>保有 {wallet.balance.toLocaleString('ja-JP')} Coin</Chip>
          </div>
        </Card>

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>💛 応援する</h2>
          <p className='mt-1 text-[11px] text-slate-500'>
            本格的な動画配信は準備中です。応援するとフィードに流れ、画面に花が咲きます。
          </p>
          <div className='mt-3'>
            <LiveCheerPanel initialBalance={wallet.balance} viewerName={viewerName} seedFeed={feed} />
          </div>
        </Card>
      </article>
    </HanakaiShell>
  );
}
