import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { formatYen, getUserName, listLives } from '@/lib/hanakai/data';
import type { LiveCategory } from '@/lib/hanakai/types';

const CATEGORY_LABEL: Record<LiveCategory, string> = {
  hanakai: '花会ライブ',
  challenge: '講師チャレンジ',
  area_launch: '地域立ち上げ',
  dream: '夢応援',
};

export default async function LivesPage() {
  const viewer = await getHanakaiViewer();
  const lives = listLives();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <div>
          <h1 className='text-lg font-bold text-slate-800'>ライブ</h1>
          <p className='text-xs text-slate-500'>ただの配信ではなく、夢や挑戦への共感と応援の場です。</p>
        </div>
        <div className='space-y-3'>
          {lives.map((live) => (
            <Link key={live.id} href={`/lives/${live.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
              <div className='relative h-40 w-full'>
                <Image src={live.coverUrl} alt={live.title} fill className='object-cover' />
                <div className='absolute left-2 top-2 flex gap-2'>
                  <Chip tone='gold'>{CATEGORY_LABEL[live.category]}</Chip>
                  {live.isLiveNow ? <span className='rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white'>● LIVE</span> : null}
                </div>
              </div>
              <div className='space-y-1 p-3'>
                <p className='text-sm font-semibold text-slate-800'>{live.title}</p>
                <p className='text-xs text-slate-500'>{getUserName(live.hostId)}</p>
                <p className='text-[11px] text-[#9b7d3f]'>🌸 応援 {formatYen(live.cheerTotal)}{live.isLiveNow ? ` ・ 視聴 ${live.viewerCount}人` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </HanakaiShell>
  );
}
