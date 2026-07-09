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

function CameraIcon() {
  return (
    <svg width='28' height='28' viewBox='0 0 24 24' fill='none' aria-hidden>
      <path
        d='M9 7h1.5l1.2-1.8c.3-.4.7-.7 1.3-.7h2c.6 0 1 .3 1.3.7L16.5 7H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <circle cx='12' cy='13' r='3.25' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  );
}

export function ProfilePhotoEmptyCard({ editHref = '/my-profile?mode=edit#profile-section-photos' }: { editHref?: string }) {
  return (
    <div className='relative overflow-hidden rounded-3xl border-2 border-dashed border-[#d4cbb8] bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f0f5f2] px-6 py-8 text-center'>
      <div
        className='pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#f3e8dc] opacity-60'
        aria-hidden
      />
      <div
        className='pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-[#e8f0ec] opacity-70'
        aria-hidden
      />
      <div className='relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#c8c2b6] bg-white text-[#9a9a9a] shadow-sm'>
        <CameraIcon />
      </div>
      <p className='relative mt-5 text-sm font-semibold text-[#1a1a1a]'>{PROFILE_PHOTO_EMPTY_TITLE}</p>
      <p className='relative mx-auto mt-3 max-w-md text-xs leading-7 text-[#6b6b6b]'>{PROFILE_PHOTO_EMPTY_BODY}</p>
      <p className='relative mt-2 text-xs text-[#9a9a9a]'>{PROFILE_PHOTO_GUIDE_NOTE}</p>
      <Link
        href={editHref}
        className='relative mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-7 text-sm font-semibold text-white transition active:scale-[0.98]'
      >
        プロフィール写真を登録する
      </Link>
    </div>
  );
}

export function ProfilePhotoSection({ member, editHref, showGuide = true }: Props) {
  const hasPhotos = memberHasProfilePhotos(member);
  const resolvedEditHref = editHref ?? '/my-profile?mode=edit#profile-section-photos';

  return (
    <div className='space-y-4'>
      {showGuide ? (
        <>
          <p className='text-xs leading-6 text-[#6b6b6b]'>{PROFILE_PHOTO_GUIDE}</p>
          <p className='text-xs text-[#9a9a9a]'>{PROFILE_PHOTO_GUIDE_NOTE}</p>
        </>
      ) : null}
      {hasPhotos ? (
        <MemberPhotoGallery member={member} />
      ) : (
        <ProfilePhotoEmptyCard editHref={resolvedEditHref} />
      )}
    </div>
  );
}
