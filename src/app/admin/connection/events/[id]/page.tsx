import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminCard, AdminPageHeader, EventStatusBadge, KpiCard } from '@/components/admin/ui';
import { ConnectionHeatMap } from '@/components/admin/heat-map';
import {
  categoryLabel,
  getAdminEvent,
  getAdminUser,
  getDuplicateAlerts,
  getSelectionStats,
} from '@/lib/connection/admin-data';
import { formatEventDate } from '@/lib/connection/data';
import { resolveAvatarDisplayUrl } from '@/lib/connection/member-photo';

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = getAdminEvent(id);
  if (!event) notFound();

  const stats = getSelectionStats(event.selectedMemberIds, event.capacity);
  const alerts = getDuplicateAlerts(event.selectedMemberIds);
  const members = event.selectedMemberIds.map((mid) => getAdminUser(mid)).filter(Boolean);

  return (
    <div className='space-y-6'>
      <Link href='/admin/connection/events' className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
        ← イベント審査へ
      </Link>

      <div className='flex flex-wrap items-center gap-2'>
        <AdminPageHeader kicker='CONNECTION DESIGN' title={event.title} />
        <EventStatusBadge value={event.status} />
      </div>
      <p className='text-sm text-[#6b6b6b]'>
        {categoryLabel(event.category)} · 主催 {event.hostName} · {formatEventDate(event.startAt)} · {event.area}
      </p>

      {/* 選定中メンバー統計 */}
      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>選定中メンバー</h2>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <KpiCard label='選定 / 定員' value={`${stats.selectedCount} / ${stats.capacity}`} />
          <KpiCard label='初参加者数' value={stats.firstTimers} />
          <KpiCard label='リピーター数' value={stats.repeaters} />
          <KpiCard label='新しいConnection率' value={`${Math.round(stats.newConnectionRate * 100)}%`} />
        </div>
      </section>

      {/* 重複アラート */}
      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>重複アラート</h2>
        {alerts.length === 0 ? (
          <AdminCard>
            <p className='text-sm text-[#1f5d4f]'>初対面同士の組み合わせです。新しいConnectionが生まれやすい構成です。</p>
          </AdminCard>
        ) : (
          <div className='space-y-2'>
            {alerts.map((a, i) => (
              <p
                key={i}
                className={
                  a.level === 'warn'
                    ? 'rounded-xl border border-[#e7b9b9] bg-[#fbeeee] px-4 py-2.5 text-xs text-[#a23b3b]'
                    : 'rounded-xl border border-[#ecd9a8] bg-[#fbf3df] px-4 py-2.5 text-xs text-[#8a6a2b]'
                }
              >
                {a.level === 'warn' ? '⚠ ' : 'ℹ '}
                {a.message}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Connection Heat Map */}
      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>Connection Heat Map</h2>
        <AdminCard>
          <ConnectionHeatMap memberIds={event.selectedMemberIds} />
        </AdminCard>
      </section>

      {/* メンバー一覧 */}
      <section>
        <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>選定中メンバー一覧</h2>
        {members.length === 0 ? (
          <AdminCard>
            <p className='text-sm text-[#9a9a9a]'>まだメンバーが選定されていません。</p>
          </AdminCard>
        ) : (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {members.map((m) => (
              <AdminCard key={m!.id}>
                <div className='flex items-center gap-3'>
                  <Image src={resolveAvatarDisplayUrl({ avatarUrl: m!.avatarUrl, gender: m!.gender })} alt={m!.nickname} width={40} height={40} className='h-10 w-10 rounded-full object-cover object-top' />
                  <div>
                    <p className='text-sm font-medium text-[#1a1a1a]'>{m!.nickname}</p>
                    <p className='text-[11px] text-[#6b6b6b]'>
                      参加{m!.participationCount}回 · 再会率{Math.round(m!.reunionRate * 100)}%
                    </p>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
