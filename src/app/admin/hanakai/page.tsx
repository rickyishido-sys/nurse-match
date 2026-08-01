import Link from 'next/link';
import { AdminCard, AdminPageHeader, Badge, KpiCard } from '@/components/admin/ui';
import {
  AdminEmptyState,
  formatAdminDate,
  formatKpiValue,
} from '@/components/admin/hanakai/hanakai-admin-shared';
import { HanakaiAdminMemberAvatar } from '@/components/admin/hanakai/hanakai-admin-member-avatar';
import { getHanakaiAdminDashboard } from '@/lib/connection/hanakai-admin-repo';

const statusTone = {
  pending: 'amber' as const,
  awaiting_confirmation: 'amber' as const,
  confirmed: 'green' as const,
  rejected: 'redSoft' as const,
  cancelled: 'gray' as const,
};

const statusLabel = {
  pending: '承認待ち',
  awaiting_confirmation: '参加確認待ち',
  confirmed: '参加確定',
  rejected: '却下',
  cancelled: '辞退',
};

export default async function HanakaiAdminDashboardPage() {
  const data = await getHanakaiAdminDashboard();
  const { kpis } = data;

  return (
    <div className='space-y-8'>
      <AdminPageHeader
        kicker='OVERVIEW'
        title='運営ダッシュボード'
        description='体験を通じて人と出会うコミュニティ HANAKAI の運営状況です。'
      />

      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>KPI</h2>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <KpiCard label='会員数' value={kpis.memberCount} />
          <KpiCard label='イベント数' value={kpis.eventCount} />
          <KpiCard label='開催予定イベント' value={kpis.upcomingEventCount} />
          <KpiCard label='参加申請数' value={kpis.applicationCount} />
          <KpiCard label='承認待ち申請' value={kpis.pendingApplicationCount} />
          <Link href='/admin/hanakai/reports' className='block'>
            <KpiCard
              label='通報件数'
              value={formatKpiValue(kpis.reportCount)}
              hint='要対応（open / reviewing）'
            />
          </Link>
          <KpiCard
            label='写真利用許可申請'
            value={formatKpiValue(kpis.photoUsageRequestCount)}
            hint='承認待ち'
          />
          <KpiCard label='グループ投稿数' value={formatKpiValue(kpis.groupPostCount)} />
        </div>
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-[#1a1a1a]'>最近の動き — 新規登録</h2>
            <Link href='/admin/hanakai/members' className='text-xs font-medium text-[#1f5d4f]'>
              会員一覧 →
            </Link>
          </div>
          {data.recentMembers.length === 0 ? (
            <AdminEmptyState title='会員がまだいません' />
          ) : (
            <div className='space-y-2'>
              {data.recentMembers.map((m) => (
                <AdminCard key={m.id} className='flex items-center justify-between gap-3 py-3'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <HanakaiAdminMemberAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} gender={m.gender} size={36} />
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{m.nickname}</p>
                      <p className='text-[11px] text-[#9a9a9a]'>{formatAdminDate(m.createdAt)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/hanakai/members/${m.id}`}
                    className='shrink-0 text-[11px] font-medium text-[#1f5d4f]'
                  >
                    詳細 →
                  </Link>
                </AdminCard>
              ))}
            </div>
          )}
        </section>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-[#1a1a1a]'>最近の動き — 新規イベント</h2>
            <Link href='/admin/hanakai/events' className='text-xs font-medium text-[#1f5d4f]'>
              イベント一覧 →
            </Link>
          </div>
          {data.recentEvents.length === 0 ? (
            <AdminEmptyState title='イベントがまだありません' />
          ) : (
            <div className='space-y-2'>
              {data.recentEvents.map((e) => (
                <AdminCard key={e.id} className='py-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{e.title}</p>
                      <p className='mt-0.5 text-[11px] text-[#6b6b6b]'>
                        {e.categoryLabel} · {formatAdminDate(e.startAt)}
                      </p>
                    </div>
                    <Link href='/admin/hanakai/events' className='text-[11px] text-[#1f5d4f]'>
                      一覧 →
                    </Link>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>最近の動き — 新規参加申請</h2>
          <Link href='/admin/hanakai/applications' className='text-xs font-medium text-[#1f5d4f]'>
            申請一覧 →
          </Link>
        </div>
        {data.recentApplications.length === 0 ? (
          <AdminEmptyState title='参加申請がまだありません' />
        ) : (
          <div className='overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white'>
            <table className='min-w-full text-left text-sm'>
              <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
                <tr>
                  <th className='px-4 py-3 font-medium'>イベント</th>
                  <th className='px-4 py-3 font-medium'>申請者</th>
                  <th className='px-4 py-3 font-medium'>申請日時</th>
                  <th className='px-4 py-3 font-medium'>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.map((a) => (
                  <tr key={a.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                    <td className='px-4 py-3'>{a.eventTitle}</td>
                    <td className='px-4 py-3'>{a.memberNickname}</td>
                    <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(a.appliedAt)}</td>
                    <td className='px-4 py-3'>
                      <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>要対応 — 承認待ち参加申請</h2>
          {data.pendingApplications.length === 0 ? (
            <AdminEmptyState title='承認待ちの申請はありません' description='すべて処理済みです。' />
          ) : (
            <div className='space-y-2'>
              {data.pendingApplications.map((a) => (
                <AdminCard key={a.id} className='py-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-[#1a1a1a]'>{a.eventTitle}</p>
                      <p className='text-xs text-[#6b6b6b]'>
                        {a.memberNickname} · {formatAdminDate(a.appliedAt)}
                      </p>
                    </div>
                    <Badge tone='amber'>承認待ち</Badge>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>要対応 — 開催日時が近いイベント</h2>
          {data.upcomingEvents.length === 0 ? (
            <AdminEmptyState title='開催予定のイベントはありません' />
          ) : (
            <div className='space-y-2'>
              {data.upcomingEvents.map((e) => (
                <AdminCard key={e.id} className='py-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-[#1a1a1a]'>{e.title}</p>
                      <p className='text-xs text-[#6b6b6b]'>
                        {formatAdminDate(e.startAt)} · {e.area}
                      </p>
                    </div>
                    <Badge tone='green'>{e.confirmedCount}/{e.capacity} 名</Badge>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
