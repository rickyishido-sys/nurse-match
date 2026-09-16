import { ProfileAvatarMedia } from '@/components/connection/member-avatar';
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
  return (
    <ProfileAvatarMedia
      src={src}
      alt={nickname}
      size={size}
      className={className}
      rounded={rounded}
    />
  );
}
