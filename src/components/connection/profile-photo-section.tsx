'use client';

import Link from 'next/link';
import {
  PROFILE_PHOTO_EMPTY_BODY,
  PROFILE_PHOTO_EMPTY_TITLE,
  PROFILE_PHOTO_GUIDE,
  PROFILE_PHOTO_GUIDE_NOTE,
} from '@/lib/connection/bloom-ui-labels';
import { memberHasProfilePhotos } from '@/lib/connection/member-photo';
import type { ConnectionMember } from '@/lib/connection/types';
import { MemberPhotoGallery } from './member-avatar';

type Props = {
  member: Pick<ConnectionMember, 'nickname' | 'photos' | 'avatarUrl'>;
  editHref?: string;
  showGuide?: boolean;
};

export function ProfilePhotoEmptyCard({ editHref = '/my-profile?mode=edit' }: { editHref?: string }) {
  return (
    <div className='rounded-2xl border border-dashed border-[#d8d4cc] bg-[#faf9f6] px-5 py-6 text-center'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#c8c2b6] bg-white text-2xl text-[#9a9a9a]'>
        📷
      </div>
      <p className='mt-4 text-sm font-semibold text-[#1a1a1a]'>{PROFILE_PHOTO_EMPTY_TITLE}</p>
      <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>{PROFILE_PHOTO_EMPTY_BODY}</p>
      <Link
        href={editHref}
        className='mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
      >
        写真を登録する
      </Link>
    </div>
  );
}

export function ProfilePhotoSection({ member, editHref, showGuide = true }: Props) {
  const hasPhotos = memberHasProfilePhotos(member);

  return (
    <div className='space-y-4'>
      {showGuide ? (
        <>
          <p className='text-xs leading-6 text-[#6b6b6b]'>{PROFILE_PHOTO_GUIDE}</p>
          <p className='text-xs text-[#9a9a9a]'>{PROFILE_PHOTO_GUIDE_NOTE}</p>
        </>
      ) : null}
      {hasPhotos ? <MemberPhotoGallery member={member} /> : <ProfilePhotoEmptyCard editHref={editHref} />}
    </div>
  );
}
