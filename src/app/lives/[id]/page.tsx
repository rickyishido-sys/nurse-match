import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip, ThrowFlowerMenu } from '@/components/hanakai/ui';
import { cheerAction } from '@/lib/hanakai/actions';
import { formatYen, getLive, getUser, LIVE_CATEGORY_LABEL, THROW_FLOWER_TIERS } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LiveDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const live = getLive(id);
  if (!live) notFound();

  const viewer = await getHanakaiViewer();
  const host = getUser(live.hostId);
  const cheeredAmount = sp.cheered ? Number(sp.cheered) : 0;

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
              <p className='text-xs text-slate-500'>集まった応援（投げ花）</p>
              <p className='text-lg font-bold text-[#9b7d3f]'>🌸 {formatYen(live.cheerTotal)}</p>
            </div>
            <Chip tone='gold'>本人に約80%が届きます</Chip>
          </div>
        </Card>

        {cheeredAmount > 0 ? (
          <p className='rounded-2xl bg-[#f6efdf] px-3 py-2 text-sm text-[#9b7d3f]'>
            🌸 {formatYen(cheeredAmount)}の投げ花を贈りました。挑戦への応援、ありがとうございます。
          </p>
        ) : null}

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>🌸 花を贈って応援する</h2>
          <p className='mt-1 text-[11px] text-slate-500'>本格的な動画配信は準備中です。まずは夢への共感を投げ花で。</p>
          <div className='mt-3'>
            <ThrowFlowerMenu tiers={THROW_FLOWER_TIERS} action={cheerAction} hiddenFields={{ liveId: live.id }} />
          </div>
        </Card>
      </article>
    </HanakaiShell>
  );
}
