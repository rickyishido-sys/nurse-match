import type { MemberTrustStats } from '@/lib/connection/member-trust-stats';

type Props = {
  stats: MemberTrustStats;
  className?: string;
};

export function MemberTrustStatsPanel({ stats, className = '' }: Props) {
  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-2 text-left text-xs sm:grid-cols-3 ${className}`}>
      <div>
        <dt className='text-[#9a9a9a]'>参加回数</dt>
        <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{stats.participationCount}</dd>
      </div>
      <div>
        <dt className='text-[#9a9a9a]'>開催回数</dt>
        <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{stats.hostCount}</dd>
      </div>
      <div>
        <dt className='text-[#9a9a9a]'>参加率</dt>
        <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{stats.participationRate}%</dd>
      </div>
      <div>
        <dt className='text-[#9a9a9a]'>レビュー</dt>
        <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>
          {stats.reviewScore != null ? stats.reviewScore.toFixed(1) : 'レビューなし'}
        </dd>
      </div>
      <div>
        <dt className='text-[#9a9a9a]'>無断欠席</dt>
        <dd className='mt-0.5 font-semibold text-[#1a1a1a]'>{stats.noShowCount}回</dd>
      </div>
    </dl>
  );
}
