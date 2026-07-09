import type { BloomTimelineEntry } from '@/lib/connection/bloom-phase4-types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

type Props = {
  entries: BloomTimelineEntry[];
  mode: 'owner' | 'public' | 'admin';
};

export function BloomTimelineCard({ entries, mode }: Props) {
  if (entries.length === 0) {
    if (mode === 'admin') {
      return <p className='text-sm text-[#9a9a9a]'>Timeline はまだありません</p>;
    }
    return (
      <p className='text-sm text-[#c4c0b8]'>
        {mode === 'owner' ? 'まだ記録がありません。イベントに参加すると、ここに体験が積み重なっていきます。' : null}
      </p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className='space-y-0'>
      {sorted.map((entry, i) => (
        <div key={entry.id} className='relative pl-4'>
          {i < sorted.length - 1 ? (
            <span className='absolute bottom-0 left-[5px] top-6 w-px bg-[#e7e2d8]' aria-hidden />
          ) : null}
          <span
            className='absolute left-0 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#b8956a] bg-white'
            aria-hidden
          />
          <div className='border-b border-[#f1efe9] py-4 last:border-b-0'>
            <p className='text-xs font-medium text-[#9a9a9a]'>{formatDate(entry.createdAt)}</p>
            <p className='mt-1 text-sm font-semibold text-[#1a1a1a]'>{entry.title}</p>
            {entry.description ? (
              <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{entry.description}</p>
            ) : null}
            {mode === 'owner' && entry.visibility === 'private' ? (
              <p className='mt-1 text-[10px] text-[#9a9a9a]'>非公開</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
