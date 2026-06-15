import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { formatYen, getUserName, listLives, LIVE_CATEGORY_LABEL } from '@/lib/hanakai/data';

const LIVE_EXAMPLES = [
  '講師チャレンジライブ',
  '地域花会立ち上げライブ',
  '花屋開業ライブ',
  'ドイツ花留学ライブ',
  '花会開催レポートライブ',
];

export default async function LivesPage() {
  const viewer = await getHanakaiViewer();
  const lives = listLives();
  const liveNow = lives.filter((l) => l.isLiveNow);
  const upcoming = lives.filter((l) => !l.isLiveNow);

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-5'>
        <section className='rounded-3xl bg-gradient-to-br from-[#eef4ea] to-[#fbeef0] p-5'>
          <p className='text-xs font-semibold tracking-[0.2em] text-[#4f7a4a]'>夢を語るライブ</p>
          <h1 className='mt-1 text-lg font-bold text-slate-800'>挑戦を、ライブで応援する。</h1>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            ただの配信ではありません。夢や挑戦を語る人に、投げ花で共感を贈る場です。
          </p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {LIVE_EXAMPLES.map((label) => (
              <span key={label} className='rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-[#4f7a4a]'>{label}</span>
            ))}
          </div>
        </section>

        {liveNow.length > 0 ? (
          <section>
            <h2 className='mb-2 text-sm font-bold text-slate-800'>配信中</h2>
            <div className='space-y-3'>
              {liveNow.map((live) => (
                <LiveCard key={live.id} live={live} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>これからのライブ</h2>
          <div className='space-y-3'>
            {upcoming.map((live) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        </section>
      </div>
    </HanakaiShell>
  );
}

function LiveCard({ live }: { live: ReturnType<typeof listLives>[number] }) {
  return (
    <Link href={`/lives/${live.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
      <div className='relative h-40 w-full'>
        <Image src={live.coverUrl} alt={live.title} fill className='object-cover' />
        <div className='absolute left-2 top-2 flex gap-2'>
          <Chip tone='gold'>{LIVE_CATEGORY_LABEL[live.category]}</Chip>
          {live.isLiveNow ? <span className='rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white'>● LIVE</span> : null}
        </div>
      </div>
      <div className='space-y-1 p-3'>
        <p className='text-sm font-semibold text-slate-800'>{live.title}</p>
        <p className='text-xs text-slate-500'>{getUserName(live.hostId)}</p>
        <p className='text-[11px] text-[#9b7d3f]'>🌸 応援 {formatYen(live.cheerTotal)}{live.isLiveNow ? ` ・ 視聴 ${live.viewerCount}人` : ''}</p>
      </div>
    </Link>
  );
}
