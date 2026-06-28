import Image from 'next/image';
import { Chip } from '@/components/connection/ui';
import { GROUP_PHOTO_STATUS_LABEL } from '@/lib/connection/group-feed';
import type { GroupPhoto } from '@/lib/connection/types';

type GroupPhotoGalleryProps = {
  photos: GroupPhoto[];
};

export function GroupPhotoGallery({ photos }: GroupPhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <p className='text-sm text-[#9a9a9a]'>まだ写真がありません。参加者限定で共有できます。</p>
    );
  }

  return (
    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
      {photos.map((photo) => (
        <div key={photo.id} className='group relative aspect-square overflow-hidden rounded-xl border border-[#ebe9e4] bg-[#f5f4f2]'>
          <Image src={photo.url} alt='' fill sizes='120px' className='object-cover transition group-hover:scale-[1.02]' />
          <span className='absolute bottom-1 left-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] text-white'>
            {GROUP_PHOTO_STATUS_LABEL[photo.usageStatus]}
          </span>
        </div>
      ))}
    </div>
  );
}
