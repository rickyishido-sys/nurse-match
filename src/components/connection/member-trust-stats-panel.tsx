import type { MemberTrustStats } from '@/lib/connection/member-trust-stats';

type Props = {
  stats: MemberTrustStats;
  className?: string;
  /** 本人・主催者・運営向けに無断欠席を表示するか */
  showNoShow?: boolean;
};

const MIN_PARTICIPATION_RATE_SAMPLE = 3;

export function MemberTrustStatsPanel({ stats, className = '', showNoShow = false }: Props) {
  const items: Array<{ label: string; value: string }> = [];

  if (stats.participationCount >= 1) {
    items.push({ label: '参加回数', value: String(stats.participationCount) });
  }
  if (stats.hostCount >= 1) {
    items.push({ label: '開催回数', value: String(stats.hostCount) });
  }
  if (
    stats.participationRate > 0 &&
    stats.participationCount + stats.noShowCount >= MIN_PARTICIPATION_RATE_SAMPLE
  ) {
    items.push({ label: '参加率', value: `${stats.participationRate}%` });
  }
  if (stats.reviewScore != null) {
    items.push({ label: 'レビュー', value: stats.reviewScore.toFixed(1) });
  }
  if (showNoShow && stats.noShowCount >= 1) {
    items.push({ label: '無断欠席', value: `${stats.noShowCount}回` });
  }

  if (items.length === 0) return null;

  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-2 text-left text-xs sm:grid-cols-3 ${className}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className='text-[#9a9a9a]'>{item.label}</dt>
          <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
