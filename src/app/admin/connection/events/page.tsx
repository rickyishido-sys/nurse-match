import Link from 'next/link';
import { AdminCard, AdminPageHeader, EventStatusBadge, FlashBanner } from '@/components/admin/ui';
import { categoryLabel, listAdminEvents } from '@/lib/connection/admin-data';
import { updateAdminEventNoteAction, updateAdminEventStatusAction } from '@/lib/connection/admin-actions';
import { formatEventDate } from '@/lib/connection/data';
import type { AdminEvent } from '@/lib/connection/admin-types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function fee(n: number) {
  return n > 0 ? `¥${n.toLocaleString('ja-JP')}` : '無料';
}

const actionBtn =
  'rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]';

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const updated = typeof sp.updated === 'string' ? sp.updated : '';
  const events = listAdminEvents();

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='EVENTS'
        title='イベント審査'
        description='ユーザーが作成したイベントを公開してよいかを審査します。差戻し時は理由を添えてください。'
      />

      {updated ? <FlashBanner>イベントのステータスを更新しました。</FlashBanner> : null}

      <div className='space-y-4'>
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className='text-[10px] text-[#9a9a9a]'>{label}</p>
      <p className='text-xs font-medium text-[#1a1a1a]'>{children}</p>
    </div>
  );
}

function EventRow({ event: e }: { event: AdminEvent }) {
  return (
    <AdminCard>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>{e.title}</p>
            <EventStatusBadge value={e.status} />
          </div>
          <p className='mt-1 text-xs text-[#6b6b6b]'>
            {categoryLabel(e.category)} · 主催 {e.hostName}
          </p>
        </div>
        <Link
          href={`/admin/connection/events/${e.id}`}
          className='rounded-full border border-[#1f5d4f] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1f5d4f]'
        >
          選定補助・Heat Map →
        </Link>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Field label='開催日時'>{formatEventDate(e.startAt)}</Field>
        <Field label='場所'>{e.area}</Field>
        <Field label='定員'>{e.capacity}名</Field>
        <Field label='参加費'>{fee(e.fee)}</Field>
        <Field label='承認方式'>{e.approvalMode === 'auto' ? '自動承認' : '主催者承認制'}</Field>
        <Field label='作成日'>{new Date(e.createdAt).toLocaleDateString('ja-JP')}</Field>
      </div>

      {e.status === 'returned' && e.returnReason ? (
        <p className='mt-3 rounded-xl border border-[#eccaba] bg-[#fbf0ea] px-3 py-2 text-xs text-[#a8602f]'>
          差戻し理由：{e.returnReason}
        </p>
      ) : null}

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <form action={updateAdminEventStatusAction}>
          <input type='hidden' name='eventId' value={e.id} />
          <input type='hidden' name='status' value='published' />
          <button className={`${actionBtn} bg-[#1f5d4f] text-white`}>公開する</button>
        </form>
        <form action={updateAdminEventStatusAction}>
          <input type='hidden' name='eventId' value={e.id} />
          <input type='hidden' name='status' value='unpublished' />
          <button className={`${actionBtn} border border-[#e2ddd2] bg-white text-[#6b6b6b]`}>非公開にする</button>
        </form>
      </div>

      <form action={updateAdminEventStatusAction} className='mt-3'>
        <input type='hidden' name='eventId' value={e.id} />
        <input type='hidden' name='status' value='returned' />
        <label className='mb-1.5 block text-[11px] text-[#9a9a9a]'>差戻し（理由を記入）</label>
        <div className='flex gap-2'>
          <textarea
            name='returnReason'
            rows={2}
            defaultValue={e.returnReason ?? ''}
            placeholder='例：定員が多すぎます。少人数での開催をご検討ください。'
            className='flex-1 resize-none rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs leading-6 outline-none focus:border-[#1f5d4f]'
          />
          <button className={`${actionBtn} shrink-0 self-end border border-[#a8602f] bg-white text-[#a8602f]`}>
            差戻し
          </button>
        </div>
      </form>

      <form action={updateAdminEventNoteAction} className='mt-3'>
        <input type='hidden' name='eventId' value={e.id} />
        <label className='mb-1.5 block text-[11px] text-[#9a9a9a]'>運営メモ</label>
        <div className='flex gap-2'>
          <textarea
            name='note'
            rows={2}
            defaultValue={e.adminNote ?? ''}
            className='flex-1 resize-none rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs leading-6 outline-none focus:border-[#1f5d4f]'
          />
          <button className='shrink-0 self-end rounded-lg border border-[#1f5d4f] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f5d4f]'>
            保存
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
