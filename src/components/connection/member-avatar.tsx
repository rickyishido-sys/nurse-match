import Image from 'next/image';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';
import type { ConnectionMember } from '@/lib/connection/types';

type MemberAvatarProps = {
  member: Pick<ConnectionMember, 'nickname' | 'avatarUrl' | 'photos'>;
  size?: number;
  className?: string;
  priority?: boolean;
};

/** メインプロフィール写真（1枚目）を表示。未設定時はイニシャル。 */
export function MemberAvatar({ member, size = 40, className = '', priority }: MemberAvatarProps) {
  const src = memberMainPhotoUrl(member);
  const px = `${size}px`;

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-[#ebe9e4] ${className}`}
        style={{ width: px, height: px }}
      >
        <Image src={src} alt={member.nickname} fill sizes={`${size}px`} className='object-cover' priority={priority} />
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
  editable = false,
}: {
  member: Pick<ConnectionMember, 'nickname' | 'photos' | 'avatarUrl'>;
  editable?: boolean;
}) {
  const photos = [...(member.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  if (photos.length === 0 && !editable) return null;

  return (
    <div className='space-y-3'>
      <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>プロフィール写真</p>
      {photos.length === 0 ? (
        <p className='text-sm text-[#c4c0b8]'>まだ写真がありません</p>
      ) : (
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
      )}
    </div>
  );
}
