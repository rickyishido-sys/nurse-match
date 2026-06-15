import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { formatYen, getLive, getUser } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { params: Promise<{ id: string }> };

export default async function LiveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const live = getLive(id);
  if (!live) notFound();

  const viewer = await getHanakaiViewer();
  const host = getUser(live.hostId);

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
              <p className='text-xs text-slate-500'>集まった応援（投げ花）</p>
              <p className='text-lg font-bold text-[#9b7d3f]'>🌸 {formatYen(live.cheerTotal)}</p>
            </div>
            <Chip tone='gold'>本人に約80%が届きます</Chip>
          </div>
        </Card>

        <div className='rounded-3xl border border-dashed border-[#d8e2d3] bg-white p-4 text-center'>
          <p className='text-xs text-slate-500'>本格的な動画配信は準備中です。まずは応援の循環から。</p>
          <button className='mt-2 h-11 w-full rounded-2xl bg-[#caa66a] text-sm font-bold text-white'>🌸 花を贈って応援する</button>
        </div>
      </article>
    </HanakaiShell>
  );
}
