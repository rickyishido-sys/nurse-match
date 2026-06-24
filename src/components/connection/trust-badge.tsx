import { getPublicTrustBadges } from '@/lib/connection/trust';
import type { ConnectionMember } from '@/lib/connection/types';

const toneClass = {
  verified: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  identity: 'border border-[#ebe9e4] bg-white text-[#4a4a4a]',
  reviewing: 'border border-amber-200 bg-amber-50 text-amber-800',
  muted: 'border border-[#ebe9e4] bg-[#f5f4f2] text-[#6b6b6b]',
};

type TrustBadgeListProps = {
  member: ConnectionMember;
  className?: string;
};

/** 本人確認・Trust Verification の公開バッジ */
export function TrustBadgeList({ member, className = '' }: TrustBadgeListProps) {
  const badges = getPublicTrustBadges(member);
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${toneClass[badge.tone]}`}
        >
          {badge.tone === 'verified' ? (
            <svg viewBox='0 0 12 12' className='h-3 w-3 shrink-0' aria-hidden='true'>
              <path
                fill='currentColor'
                d='M6 0.5L7.4 2.3L9.6 1.8L9.8 4.1L12 5L10.5 6.8L10.9 9L8.7 9.2L7.5 11.2L6 9.8L4.5 11.2L3.3 9.2L1.1 9L1.5 6.8L0 5L2.2 4.1L2.4 1.8L4.6 2.3L6 0.5Z'
              />
            </svg>
          ) : null}
          {badge.label}
        </span>
      ))}
    </div>
  );
}
