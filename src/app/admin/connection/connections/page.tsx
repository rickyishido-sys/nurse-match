import { AdminCard, AdminPageHeader } from '@/components/admin/ui';
import { getAdminUser, listConnectionHistories } from '@/lib/connection/admin-data';
import { getEvent } from '@/lib/connection/data';
import type { ConnectionHistory } from '@/lib/connection/admin-types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function name(id: string) {
  return getAdminUser(id)?.nickname ?? id;
}
function eventTitle(id: string) {
  return getEvent(id)?.title ?? id;
}

export default async function AdminConnectionsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const min = typeof sp.min === 'string' ? Number(sp.min) || 0 : 0;
  const reunionOnly = sp.reunion === '1';
  const eventFilter = typeof sp.event === 'string' ? sp.event : '';

  const histories = listConnectionHistories();
  const eventOptions = Array.from(new Set(histories.map((h) => h.lastEventId)));

  const filtered = histories
    .filter((h) => (min ? h.meetingCount >= min : true))
    .filter((h) => (reunionOnly ? Boolean(h.mutualReunionWish) : true))
    .filter((h) => (eventFilter ? h.eventIds.includes(eventFilter) : true))
    .filter((h) => {
      if (!q) return true;
      const a = name(h.memberAId);
      const b = name(h.memberBId);
      return a.includes(q) || b.includes(q);
    })
    .sort((a, b) => b.meetingCount - a.meetingCount);

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='CONNECTIONS'
        title='Connection履歴'
        description='過去に誰と誰が会ったことがあるか。HANAKAIの核となる、再会と新しい出会いの設計のための記録です。'
      />

      <AdminCard>
        <form method='get' className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <label className='mb-1 block text-[11px] text-[#9a9a9a]'>メンバー名で検索</label>
            <input
              name='q'
              defaultValue={q}
              placeholder='例：あやか'
              className='w-full rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs outline-none focus:border-[#1f5d4f]'
            />
          </div>
          <div>
            <label className='mb-1 block text-[11px] text-[#9a9a9a]'>同席回数</label>
            <select name='min' defaultValue={String(min)} className='w-full rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs outline-none focus:border-[#1f5d4f]'>
              <option value='0'>すべて</option>
              <option value='1'>1回以上</option>
              <option value='2'>2回以上</option>
              <option value='3'>3回以上</option>
            </select>
          </div>
          <div>
            <label className='mb-1 block text-[11px] text-[#9a9a9a]'>イベント別</label>
            <select name='event' defaultValue={eventFilter} className='w-full rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs outline-none focus:border-[#1f5d4f]'>
              <option value=''>すべて</option>
              {eventOptions.map((id) => (
                <option key={id} value={id}>{eventTitle(id)}</option>
              ))}
            </select>
          </div>
          <div className='flex items-end gap-3'>
            <label className='flex items-center gap-2 text-xs text-[#4a4a4a]'>
              <input type='checkbox' name='reunion' value='1' defaultChecked={reunionOnly} className='h-4 w-4 accent-[#1f5d4f]' />
              再会希望あり
            </label>
            <button className='ml-auto rounded-lg bg-[#1f5d4f] px-4 py-2 text-xs font-semibold text-white'>絞り込む</button>
          </div>
        </form>
      </AdminCard>

      <p className='text-xs text-[#9a9a9a]'>{filtered.length}件の組み合わせ</p>

      <div className='space-y-3'>
        {filtered.map((h) => (
          <ConnectionRow key={h.id} history={h} />
        ))}
        {filtered.length === 0 ? (
          <AdminCard>
            <p className='text-sm text-[#9a9a9a]'>条件に一致する履歴はありません。</p>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}

function ConnectionRow({ history: h }: { history: ConnectionHistory }) {
  const mutual = Boolean(h.mutualReunionWish);
  let accent = 'border-l-[#bcdacb]';
  let countCls = 'bg-[#eef6f1] text-[#1f5d4f]';
  let countLabel = '初対面';
  if (mutual) {
    accent = 'border-l-[#1f5d4f]';
  } else if (h.meetingCount >= 2) {
    accent = 'border-l-[#e7b9b9]';
  } else if (h.meetingCount === 1) {
    accent = 'border-l-[#ecd9a8]';
  }
  if (h.meetingCount >= 2) {
    countCls = 'bg-[#fbeeee] text-[#a23b3b]';
    countLabel = `${h.meetingCount}回同席`;
  } else if (h.meetingCount === 1) {
    countCls = 'bg-[#fbf3df] text-[#8a6a2b]';
    countLabel = '1回同席';
  }

  return (
    <div className={`rounded-2xl border border-[#ebe7dd] border-l-4 bg-white p-4 ${accent}`}>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-semibold text-[#1a1a1a]'>{name(h.memberAId)}</p>
          <span className='text-[#9a9a9a]'>×</span>
          <p className='text-sm font-semibold text-[#1a1a1a]'>{name(h.memberBId)}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${countCls}`}>
            {countLabel}
          </span>
          {mutual ? (
            <span className='inline-flex items-center rounded-full bg-[#1f5d4f] px-2.5 py-0.5 text-[11px] font-medium text-white'>
              両者が再会希望 ♥
            </span>
          ) : null}
        </div>
      </div>
      <div className='mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#6b6b6b] sm:grid-cols-3'>
        <p>最終同席：{new Date(h.lastMetAt).toLocaleDateString('ja-JP')}</p>
        <p>最終イベント：{eventTitle(h.lastEventId)}</p>
        <p>同席イベント数：{h.eventIds.length}</p>
      </div>
      {h.note ? <p className='mt-2 text-xs text-[#4a4a4a]'>メモ：{h.note}</p> : null}
    </div>
  );
}
