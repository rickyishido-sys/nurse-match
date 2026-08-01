import Image from 'next/image';
import { resolveAvatarDisplayUrl } from '@/lib/connection/member-photo';

type Props = {
  nickname: string;
  avatarUrl?: string | null;
  gender?: string | null;
  size?: number;
  className?: string;
  rounded?: 'full' | '2xl';
};

export function HanakaiAdminMemberAvatar({
  nickname,
  avatarUrl,
  gender,
  size = 36,
  className = '',
  rounded = 'full',
}: Props) {
  const src = resolveAvatarDisplayUrl({ avatarUrl, gender });
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

  if (src) {
    return (
      <Image
        src={src}
        alt={nickname}
        width={size}
        height={size}
        className={`shrink-0 object-cover object-top ${radius} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#eef3ef] font-semibold text-[#1f5d4f] ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden
    >
      {nickname.slice(0, 1)}
    </div>
  );
}
