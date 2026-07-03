import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminSearchBar, AdminSelectFilter } from '@/components/admin/hanakai/hanakai-admin-filters';
import {
  AdminEmptyState,
  AdminPhase2Note,
  formatAdminDate,
} from '@/components/admin/hanakai/hanakai-admin-shared';
import { EVENT_CATEGORY_ORDER, EVENT_CATEGORY_LABEL } from '@/lib/connection/data';
import { listHanakaiAdminEvents } from '@/lib/connection/hanakai-admin-repo';
import type { ConnectionEventCategory } from '@/lib/connection/types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const categoryOptions = [
  { value: 'all', label: 'すべてのカテゴリ' },
  ...EVENT_CATEGORY_ORDER.map((c) => ({ value: c, label: EVENT_CATEGORY_LABEL[c as ConnectionEventCategory] })),
];

const whenOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'upcoming', label: '開催予定' },
  { value: 'past', label: '過去イベント' },
];

async function EventsContent({
  query,
  category,
  when,
}: {
  query: string;
  category: string;
  when: 'upcoming' | 'past' | 'all';
}) {
  const events = await listHanakaiAdminEvents({ query, category, when });

  if (events.length === 0) {
    return <AdminEmptyState title='該当するイベントが見つかりません' />;
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>タイトル</th>
              <th className='px-4 py-3 font-medium'>カテゴリ</th>
              <th className='px-4 py-3 font-medium'>主催者</th>
              <th className='px-4 py-3 font-medium'>開催日時</th>
              <th className='px-4 py-3 font-medium'>場所</th>
              <th className='px-4 py-3 font-medium'>定員</th>
              <th className='px-4 py-3 font-medium'>申請</th>
              <th className='px-4 py-3 font-medium'>承認</th>
              <th className='px-4 py-3 font-medium'>公開</th>
              <th className='px-4 py-3 font-medium'>詳細</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='max-w-[180px] truncate px-4 py-3 font-medium'>{e.title}</td>
                <td className='px-4 py-3'>{e.categoryLabel}</td>
                <td className='px-4 py-3'>{e.hostName}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(e.startAt)}</td>
                <td className='px-4 py-3'>{e.area || e.venue || '—'}</td>
                <td className='px-4 py-3'>{e.capacity}</td>
                <td className='px-4 py-3'>{e.applicationCount}</td>
                <td className='px-4 py-3'>{e.confirmedCount}</td>
                <td className='px-4 py-3'>
                  <Badge tone={e.isPast ? 'gray' : 'green'}>{e.visibilityLabel}</Badge>
                </td>
                <td className='px-4 py-3'>
                  <AdminPhase2Note />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {events.map((e) => (
          <article key={e.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <p className='font-semibold text-[#1a1a1a]'>{e.title}</p>
                <p className='text-xs text-[#6b6b6b]'>
                  {e.categoryLabel} · {formatAdminDate(e.startAt)}
                </p>
              </div>
              <Badge tone={e.isPast ? 'gray' : 'green'}>{e.visibilityLabel}</Badge>
            </div>
            <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
              <div>
                <dt className='text-[#9a9a9a]'>主催者</dt>
                <dd>{e.hostName}</dd>
              </div>
              <div>
                <dt className='text-[#9a9a9a]'>定員</dt>
                <dd>
                  {e.confirmedCount}/{e.capacity}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminEventsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const query = param(sp, 'q');
  const category = param(sp, 'category') || 'all';
  const whenRaw = param(sp, 'when') || 'all';
  const when = (whenRaw === 'upcoming' || whenRaw === 'past' ? whenRaw : 'all') as 'upcoming' | 'past' | 'all';

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='EVENTS'
        title='イベント一覧'
        description='全イベントの一覧です。詳細・編集は Phase 2 で追加予定です。'
      />

      <div className='grid gap-3 md:grid-cols-[1fr_auto_auto]'>
        <Suspense fallback={<div className='h-10 animate-pulse rounded-xl bg-[#ebe7dd]' />}>
          <AdminSearchBar defaultValue={query} placeholder='タイトル・主催者・場所で検索' />
        </Suspense>
        <Suspense fallback={null}>
          <AdminSelectFilter paramKey='category' label='カテゴリ' options={categoryOptions} defaultValue='all' />
        </Suspense>
        <Suspense fallback={null}>
          <AdminSelectFilter paramKey='when' label='開催時期' options={whenOptions} defaultValue='all' />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded-2xl bg-[#ebe7dd]' />
            ))}
          </div>
        }
      >
        <EventsContent query={query} category={category} when={when} />
      </Suspense>
    </div>
  );
}
