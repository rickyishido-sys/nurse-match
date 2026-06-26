import { HOST_BADGE_META } from '@/lib/connection/data';
import type { HostBadge } from '@/lib/connection/types';

type HostBadgeListProps = {
  badges?: HostBadge[];
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Hostバッジ表示（UIのみ・ダミーデータ）。
 * 将来的に開催実績・本人確認・参加者評価から自動付与する想定。
 */
export function HostBadgeList({ badges, size = 'sm', className = '' }: HostBadgeListProps) {
  if (!badges || badges.length === 0) return null;

  const padding = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[10px]';

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => {
        const meta = HOST_BADGE_META[badge];
        return (
          <span
            key={badge}
            title={meta.description}
            className={`inline-flex items-center gap-1 rounded-full border border-[#e3d9c4] bg-[#fbf7ee] font-medium text-[#7a5f2e] ${padding}`}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
