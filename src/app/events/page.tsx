import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { EventsAdditionalRecruitmentSection } from '@/components/connection/events/events-additional-recruitment-section';
import { EventsCategoryFilter } from '@/components/connection/events/events-category-filter';
import { EventsListGrid, EventsListHero } from '@/components/connection/events/events-list-sections';
import { enrichEventsForList } from '@/lib/connection/events-list-data';
import { filterEventsBySlug, parseEventsListFilter } from '@/lib/connection/events-list-ux';
import { listEvents } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function EventsPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const sp = searchParams ? await searchParams : {};
  const activeFilter = parseEventsListFilter(typeof sp.category === 'string' ? sp.category : undefined);
  const registered = sp.registered === '1';

  const allEvents = (await listEvents()).filter((e) => !e.isPast);
  const filtered = filterEventsBySlug(allEvents, activeFilter);

  const additionalEvents = filtered.filter((e) => e.recruitmentType === 'additional');
  const standardEvents = filtered.filter((e) => e.recruitmentType !== 'additional');

  const [additionalItems, standardItems] = await Promise.all([
    additionalEvents.length > 0 ? enrichEventsForList(additionalEvents, viewerMemberId) : Promise.resolve([]),
    standardEvents.length > 0 ? enrichEventsForList(standardEvents, viewerMemberId) : Promise.resolve([]),
  ]);

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-8'>
        <EventsListHero />

        {registered ? (
          <p className='rounded-2xl border border-[#1f5d4f]/15 bg-[#f3f7f5] px-4 py-3 text-xs leading-6 text-[#3f5a51]'>
            プロフィール登録が完了しました。気になる体験に参加してみましょう。
          </p>
        ) : null}

        <EventsCategoryFilter active={activeFilter} />

        <EventsAdditionalRecruitmentSection items={additionalItems} />

        <div className='flex items-center justify-between gap-4'>
          <p className='text-sm text-[#6b6b6b]'>
            {allEvents.length > 0 ? (
              <>
                <span className='font-semibold text-[#1a1a1a]'>{standardEvents.length}</span>件のイベント
              </>
            ) : null}
          </p>
          <Link
            href='/events/create'
            className='hidden shrink-0 items-center gap-2 rounded-full border border-[#1f5d4f]/20 bg-[#f7faf8] px-4 py-2 text-xs font-semibold text-[#1f5d4f] transition hover:bg-[#eef3ef] sm:inline-flex'
          >
            <span aria-hidden>+</span>
            イベントを作成する
          </Link>
        </div>

        <EventsListGrid items={standardItems} activeFilter={activeFilter} totalCount={allEvents.length} />

        <Link
          href='/events/create'
          className='flex items-center justify-between gap-3 rounded-3xl border border-[#1f5d4f]/15 bg-gradient-to-br from-[#f3f7f5] to-[#eef3f0] px-6 py-5 transition active:scale-[0.99] sm:hidden'
        >
          <div>
            <p className='text-[11px] font-semibold tracking-[0.18em]' style={{ color: GOLD }}>
              主催
            </p>
            <p className='mt-1.5 text-sm font-semibold text-[#1a1a1a]'>イベントを作成する</p>
            <p className='mt-0.5 text-xs leading-6 text-[#5b6f67]'>
              あなた自身が、心地よいイベントをひらけます。
            </p>
          </div>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f5d4f] text-xl font-light text-white'>
            +
          </span>
        </Link>
      </div>
    </ConnectionShell>
  );
}
