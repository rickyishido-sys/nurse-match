import Image from 'next/image';
import Link from 'next/link';
import { NeutralProfileAvatar } from '@/components/connection/neutral-profile-avatar';
import { memberHasProfilePhotos, memberMainPhotoUrl, resolveAvatarDisplayUrl } from '@/lib/connection/member-photo';
import type { ConnectionMember } from '@/lib/connection/types';

type Rounded = 'full' | '2xl';

type ProfileAvatarMediaProps = {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  rounded?: Rounded;
  priority?: boolean;
  objectPosition?: string;
};

/** 写真 URL があれば表示。未登録・空 URL はニュートラルアイコン。 */
export function ProfileAvatarMedia({
  src,
  alt,
  size = 40,
  className = '',
  rounded = 'full',
  priority,
  objectPosition = 'object-top',
}: ProfileAvatarMediaProps) {
  const url = resolveAvatarDisplayUrl({ avatarUrl: src });
  const px = `${size}px`;
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

  if (!url) {
    return <NeutralProfileAvatar size={size} className={className} rounded={rounded} />;
  }

  return (
    <div
      data-testid='member-photo'
      className={`relative shrink-0 overflow-hidden ${radius} ring-1 ring-[#ebe9e4] ${className}`}
      style={{ width: px, height: px }}
    >
      <Image
        src={url}
        alt={alt}
        fill
        sizes={`${size}px`}
        className={`object-cover ${objectPosition}`}
        priority={priority}
      />
    </div>
  );
}

type MemberAvatarProps = {
  member: Pick<ConnectionMember, 'nickname' | 'avatarUrl' | 'photos'> & {
    gender?: ConnectionMember['gender'];
  };
  size?: number;
  className?: string;
  priority?: boolean;
  /** 写真未登録時に「写真未登録」ラベルを表示（自分のプロフィール向け） */
  showEmptyPlaceholder?: boolean;
  /** 未登録時に編集画面へリンク */
  editHref?: string;
};

/** メインプロフィール写真（1枚目）を表示。未設定時は HANAKAI ニュートラルアイコン。 */
export function MemberAvatar({
  member,
  size = 40,
  className = '',
  priority,
  showEmptyPlaceholder = false,
  editHref,
}: MemberAvatarProps) {
  const src = memberMainPhotoUrl(member);
  const media = (
    <ProfileAvatarMedia src={src} alt={member.nickname} size={size} className={className} priority={priority} />
  );

  if (!src && showEmptyPlaceholder) {
    const labeled = (
      <div className={`flex shrink-0 flex-col items-center gap-1.5 ${className}`}>
        {media}
        {size >= 64 ? (
          <span className='rounded-full border border-[#e7e2d8] bg-white px-2 py-0.5 text-[10px] font-medium text-[#6b6b6b]'>
            写真未登録
          </span>
        ) : null}
      </div>
    );
    if (editHref) {
      return (
        <Link href={editHref} className='inline-flex shrink-0 transition active:scale-[0.98]' aria-label='プロフィール写真を登録する'>
          {labeled}
        </Link>
      );
    }
    return labeled;
  }

  return media;
}

/** プロフィール写真ギャラリー（最大6枚・横スクロール） */
export function MemberPhotoGallery({
  member,
}: {
  member: Pick<ConnectionMember, 'nickname' | 'photos' | 'avatarUrl'> & {
    gender?: ConnectionMember['gender'];
  };
}) {
  const photos = [...(member.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!memberHasProfilePhotos(member)) return null;

  return (
    <div className='-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      {photos.map((photo, i) => (
        <div key={photo.id} className='relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#ebe9e4]'>
          <Image src={photo.url} alt={`${member.nickname} ${i + 1}`} fill sizes='96px' className='object-cover' />
          {i === 0 ? (
            <span className='absolute left-1 top-1 rounded-full bg-[#1f5d4f]/85 px-1.5 py-0.5 text-[9px] font-semibold text-white'>
              メイン
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
