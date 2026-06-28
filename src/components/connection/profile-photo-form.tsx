'use client';

import { saveMemberPhotosAction } from '@/lib/connection/actions';
import { ProfilePhotoUploader } from '@/components/connection/profile-photo-uploader';
import type { MemberProfilePhoto } from '@/lib/connection/types';

export function ProfilePhotoForm({ initialPhotos }: { initialPhotos: MemberProfilePhoto[] }) {
  return (
    <form action={saveMemberPhotosAction} className='space-y-4'>
      <ProfilePhotoUploader initialPhotos={initialPhotos} />
      <button
        type='submit'
        className='flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f]/25 bg-white text-sm font-semibold text-[#1f5d4f] transition active:scale-[0.98]'
      >
        写真を保存する
      </button>
    </form>
  );
}
