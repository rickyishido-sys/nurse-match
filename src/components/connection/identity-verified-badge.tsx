import { isIdentityVerified } from '@/lib/connection/trust';
import type { ConnectionMember } from '@/lib/connection/types';

type Props = {
  member: ConnectionMember;
  className?: string;
};

/** 本人確認済みバッジ（未確認は非表示） */
export function IdentityVerifiedBadge({ member, className = '' }: Props) {
  if (!isIdentityVerified(member)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#cfe3da] bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-[#1f5d4f] ${className}`}
    >
      <span aria-hidden='true'>✅</span>
      本人確認済み
    </span>
  );
}
