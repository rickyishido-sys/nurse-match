import { getPublicTrustBadges } from '@/lib/connection/trust';
import type { ConnectionMember } from '@/lib/connection/types';

const toneClass = {
  verified: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  identity: 'border border-[#cfe3da] bg-[#eef4f0] text-[#1f5d4f]',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-800',
  muted: 'border border-[#ebe9e4] bg-[#f5f4f2] text-[#6b6b6b]',
};

function CheckIcon() {
  return (
    <svg viewBox='0 0 12 12' className='h-3 w-3 shrink-0' aria-hidden='true'>
      <path
        fill='currentColor'
        d='M4.5 8.2L2.3 6l-.8.8L4.5 9.8l6-6-.8-.8L4.5 8.2z'
      />
    </svg>
  );
}

type TrustBadgeListProps = {
  member: ConnectionMember;
  className?: string;
  hideIdentity?: boolean;
};

/** 本人確認・運営確認の公開バッジ */
export function TrustBadgeList({ member, className = '', hideIdentity = false }: TrustBadgeListProps) {
  const badges = getPublicTrustBadges(member).filter(
    (badge) => !(hideIdentity && badge.key === 'identity'),
  );
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${toneClass[badge.tone]}`}
        >
          {badge.tone === 'verified' || badge.tone === 'identity' ? <CheckIcon /> : null}
          {badge.label}
        </span>
      ))}
    </div>
  );
}
