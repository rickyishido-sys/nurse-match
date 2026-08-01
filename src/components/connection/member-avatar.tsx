import Image from 'next/image';
import Link from 'next/link';
import { memberHasProfilePhotos, memberMainPhotoUrl } from '@/lib/connection/member-photo';
import type { ConnectionMember } from '@/lib/connection/types';

type MemberAvatarProps = {
  member: Pick<ConnectionMember, 'nickname' | 'avatarUrl' | 'photos'> & {
    gender?: ConnectionMember['gender'];
  };
  size?: number;
  className?: string;
  priority?: boolean;
  /** 写真未登録時に点線枠・カメラアイコン・ラベルを表示 */
  showEmptyPlaceholder?: boolean;
  /** 未登録時に編集画面へリンク */
  editHref?: string;
};

function EmptyAvatarPlaceholder({
  size,
  className,
  showLabel,
}: {
  size: number;
  className: string;
  showLabel?: boolean;
}) {
  const px = `${size}px`;
  return (
    <div className={`flex shrink-0 flex-col items-center gap-1.5 ${className}`}>
      <div
        className='flex items-center justify-center rounded-full border-2 border-dashed border-[#c8c2b6] bg-[#faf9f6] text-[#9a9a9a]'
        style={{ width: px, height: px, fontSize: Math.max(14, Math.round(size * 0.28)) }}
        aria-hidden
      >
        📷
      </div>
      {showLabel ? (
        <span className='rounded-full border border-[#e7e2d8] bg-white px-2 py-0.5 text-[10px] font-medium text-[#6b6b6b]'>
          写真未登録
        </span>
      ) : null}
    </div>
  );
}

/** メインプロフィール写真（1枚目）を表示。未設定時はイニシャルまたはプレースホルダー。 */
export function MemberAvatar({
  member,
  size = 40,
  className = '',
  priority,
  showEmptyPlaceholder = false,
  editHref,
}: MemberAvatarProps) {
  const src = memberMainPhotoUrl(member);
  const px = `${size}px`;
  const hasPhoto = Boolean(src);

  if (!hasPhoto && showEmptyPlaceholder) {
    const placeholder = <EmptyAvatarPlaceholder size={size} className={className} showLabel={size >= 64} />;
    if (editHref) {
      return (
        <Link href={editHref} className='inline-flex shrink-0 transition active:scale-[0.98]' aria-label='プロフィール写真を登録する'>
          {placeholder}
        </Link>
      );
    }
    return placeholder;
  }

  if (hasPhoto) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-[#ebe9e4] ${className}`}
        style={{ width: px, height: px }}
      >
        <Image src={src} alt={member.nickname} fill sizes={`${size}px`} className='object-cover object-top' priority={priority} />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-sm font-semibold text-[#1f5d4f] ring-1 ring-[#ebe9e4] ${className}`}
      style={{ width: px, height: px }}
      aria-hidden
    >
      {member.nickname.charAt(0) || '?'}
    </div>
  );
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
