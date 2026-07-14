import { ConnectionShell } from '@/components/connection/shell';
import { EventsActionBar } from '@/components/connection/events/events-action-bar';
import { EventsAdditionalRecruitmentSection } from '@/components/connection/events/events-additional-recruitment-section';
import { ExperienceRequestPromoCard } from '@/components/connection/events/experience-request-promo';
import { EventsCategoryFilter } from '@/components/connection/events/events-category-filter';
import { EventsListGrid, EventsListHero } from '@/components/connection/events/events-list-sections';
import { enrichEventsForList } from '@/lib/connection/events-list-data';
import { listEventsCached } from '@/lib/connection/events-list-cache';
import { filterEventsBySlug, parseEventsListFilter } from '@/lib/connection/events-list-ux';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function EventsPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const sp = searchParams ? await searchParams : {};
  const activeFilter = parseEventsListFilter(typeof sp.category === 'string' ? sp.category : undefined);
  const registered = sp.registered === '1';

  const allEvents = (await listEventsCached()).filter((e) => !e.isPast);
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

        <ExperienceRequestPromoCard />

        <EventsActionBar variant='on-events-page' />

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
        </div>

        <EventsListGrid items={standardItems} activeFilter={activeFilter} totalCount={allEvents.length} />
      </div>
    </ConnectionShell>
  );
}
