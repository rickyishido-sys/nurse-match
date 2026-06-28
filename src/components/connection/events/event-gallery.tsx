import Image from 'next/image';
import { EVENT_CATEGORY_DEFAULT_IMAGE, EVENT_CATEGORY_META } from '@/lib/connection/data';
import type { ConnectionEvent } from '@/lib/connection/types';

/**
 * イベント詳細の写真ギャラリー。
 * - 写真あり: 1枚目を大きく + 残り（最大4枚）をサムネイル並び。
 * - 写真なし: カテゴリ既定画像があれば上品に表示、無ければ
 *   生成り背景に「イベント写真はまだありません」を表示（黒背景・エラーは出さない）。
 */
export function EventGallery({ event }: { event: ConnectionEvent }) {
  const meta = EVENT_CATEGORY_META[event.category];
  const images = (event.imageUrls ?? []).filter(Boolean);

  if (images.length === 0) {
    const categoryImage = EVENT_CATEGORY_DEFAULT_IMAGE[event.category];
    return (
      <div className={`relative h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient}`}>
        {categoryImage ? (
          <Image src={categoryImage} alt='' fill className='object-contain p-10 mix-blend-multiply' priority />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center text-6xl opacity-70' aria-hidden>
            {meta.emoji}
          </div>
        )}
        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/10 to-transparent px-4 py-3 text-center'>
          <p className='text-xs font-medium text-[#5b5b5b]'>イベント写真はまだありません</p>
        </div>
      </div>
    );
  }

  const [hero, ...rest] = images;
  const thumbs = rest.slice(0, 4);

  return (
    <div className='space-y-2.5'>
      <div className='relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#f1efe9]'>
        <Image src={hero} alt={event.title} fill className='object-cover' priority sizes='(max-width: 768px) 100vw, 640px' />
      </div>
      {thumbs.length > 0 ? (
        <div className='grid grid-cols-4 gap-2.5'>
          {thumbs.map((src, i) => (
            <div key={src} className='relative aspect-square overflow-hidden rounded-xl bg-[#f1efe9]'>
              <Image
                src={src}
                alt={`${event.title} ${i + 2}`}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 25vw, 160px'
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
