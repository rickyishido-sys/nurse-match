import Link from 'next/link';
import { AdminCard, AdminPageHeader, KpiCard } from '@/components/admin/ui';
import { getAdminKpi } from '@/lib/connection/admin-data';

export default function ConnectionAdminDashboard() {
  const kpi = getAdminKpi();

  const nav = [
    { href: '/admin/connection/users', title: 'ユーザー管理', desc: '本人確認・状態・Host権限・運営メモ' },
    { href: '/admin/connection/events', title: 'イベント審査', desc: 'ユーザー作成イベントの公開・差戻し' },
    { href: '/admin/connection/hosts', title: 'Host申請管理', desc: 'イベント作成権限の承認・昇格' },
    { href: '/admin/connection/connections', title: 'Connection履歴', desc: '誰と誰が会ったことがあるか' },
    { href: '/admin/connection/reviews', title: '参加後レビュー', desc: 'イベント後アンケートの確認' },
    { href: '/admin/connection/users?focus=report', title: '通報・注意履歴', desc: '要確認ユーザーの把握' },
  ];

  return (
    <div className='space-y-7'>
      <AdminPageHeader
        kicker='OVERVIEW'
        title='運営ダッシュボード'
        description='人を集めるのではなく、最適なConnectionを設計するための運営状況です。'
      />

      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>KPI</h2>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <KpiCard label='登録ユーザー数' value={kpi.totalUsers} />
          <KpiCard label='本人確認済み数' value={kpi.verifiedUsers} hint='運営確認済み + 安心確認済み' />
          <KpiCard label='イベント数' value={kpi.totalEvents} />
          <KpiCard label='今月の参加申請数' value={kpi.monthlyApplications} />
          <KpiCard label='承認率' value={`${Math.round(kpi.approvalRate * 100)}%`} />
          <KpiCard label='Connection成立数' value={kpi.connectionsFormed} hint='出会った組み合わせ' />
          <KpiCard label='Host申請数' value={kpi.hostApplications} hint='承認待ち' />
          <KpiCard label='要確認ユーザー数' value={kpi.usersNeedingReview} />
        </div>
      </section>

      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>管理メニュー</h2>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className='block transition active:scale-[0.99]'>
              <AdminCard className='h-full'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
                  <span className='text-[#1f5d4f]'>→</span>
                </div>
                <p className='mt-1.5 text-xs leading-6 text-[#6b6b6b]'>{item.desc}</p>
              </AdminCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
