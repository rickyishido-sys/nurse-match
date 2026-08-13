import { ConnectionShell } from '@/components/connection/shell';
import { EventsActionBar } from '@/components/connection/events/events-action-bar';
import { EventsAdditionalRecruitmentSection } from '@/components/connection/events/events-additional-recruitment-section';
import { ExperienceRequestPromoCard } from '@/components/connection/events/experience-request-promo';
import { EventsCategoryFilter } from '@/components/connection/events/events-category-filter';
import { EventsRegionFilter } from '@/components/connection/events/events-region-filter';
import { EventsListGrid, EventsListHero } from '@/components/connection/events/events-list-sections';
import {
  partitionEventsByPrefecture,
  parseEventsRegionParam,
  resolvePrefectureLabel,
} from '@/lib/connection/area-match';
import { enrichEventsForList } from '@/lib/connection/events-list-data';
import { listEventsCached } from '@/lib/connection/events-list-cache';
import { filterEventsBySlug, parseEventsListFilter } from '@/lib/connection/events-list-ux';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function EventsPage({ searchParams }: PageProps) {
  // Auth + list cache in parallel; member/area follow after member id (request-scoped cache).
  const [viewer, viewerMemberId, sp, events] = await Promise.all([
    getHanakaiViewer(),
    getViewerMemberId(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
    listEventsCached(),
  ]);
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;
  const memberAreaRaw = member?.area?.trim() || '';
  const memberAreaLabel = resolvePrefectureLabel(memberAreaRaw);

  const activeFilter = parseEventsListFilter(typeof sp.category === 'string' ? sp.category : undefined);
  const regionRaw = typeof sp.region === 'string' ? sp.region : undefined;
  const region = parseEventsRegionParam(regionRaw, memberAreaRaw);
  const registered = sp.registered === '1';

  // Default: logged-in with area → local priority view; otherwise national.
  const effectiveScope =
    regionRaw == null && memberAreaLabel ? ('local' as const) : region.scope === 'prefecture' ? ('prefecture' as const) : region.scope;
  const focusPrefecture =
    effectiveScope === 'local' || effectiveScope === 'prefecture' ? region.prefecture : null;

  const activeRegionKey =
    effectiveScope === 'all'
      ? 'all'
      : effectiveScope === 'local'
        ? 'local'
        : (focusPrefecture ?? 'all');

  const allEvents = events.filter((e) => !e.isPast);
  const filtered = filterEventsBySlug(allEvents, activeFilter);

  const additionalEvents = filtered.filter((e) => e.recruitmentType === 'additional');
  const standardEvents = filtered.filter((e) => e.recruitmentType !== 'additional');

  const showSplit = Boolean(focusPrefecture) && effectiveScope !== 'all';
  const { local: localStandard, other: otherStandard } = showSplit
    ? partitionEventsByPrefecture(standardEvents, focusPrefecture)
    : { local: [] as typeof standardEvents, other: standardEvents };
  const { local: localAdditional, other: otherAdditional } = showSplit
    ? partitionEventsByPrefecture(additionalEvents, focusPrefecture)
    : { local: [] as typeof additionalEvents, other: additionalEvents };

  const nationalStandard = showSplit ? otherStandard : standardEvents;
  const nationalAdditional = showSplit ? otherAdditional : additionalEvents;

  const [
    localAdditionalItems,
    localStandardItems,
    nationalAdditionalItems,
    nationalStandardItems,
  ] = await Promise.all([
    localAdditional.length > 0 ? enrichEventsForList(localAdditional, viewerMemberId) : Promise.resolve([]),
    localStandard.length > 0 ? enrichEventsForList(localStandard, viewerMemberId) : Promise.resolve([]),
    nationalAdditional.length > 0
      ? enrichEventsForList(nationalAdditional, viewerMemberId)
      : Promise.resolve([]),
    nationalStandard.length > 0
      ? enrichEventsForList(nationalStandard, viewerMemberId)
      : Promise.resolve([]),
  ]);

  const showAreaHint = Boolean(viewerMemberId) && !memberAreaLabel;
  const regionQueryForCategory =
    regionRaw ?? (effectiveScope === 'local' ? 'local' : effectiveScope === 'all' ? 'all' : focusPrefecture);

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

        <EventsRegionFilter
          memberAreaLabel={memberAreaLabel}
          activeRegion={activeRegionKey}
          activeCategory={activeFilter}
          showAreaHint={showAreaHint}
        />

        <EventsCategoryFilter active={activeFilter} region={regionQueryForCategory} />

        {showSplit ? (
          <section className='space-y-5'>
            <div className='space-y-1'>
              <p className='text-xs font-semibold tracking-[0.16em] text-[#1f5d4f]'>YOUR AREA</p>
              <h2 className='text-lg font-semibold text-[#1a1a1a]'>{focusPrefecture}のイベント</h2>
            </div>

            {localAdditionalItems.length > 0 ? (
              <EventsAdditionalRecruitmentSection items={localAdditionalItems} />
            ) : null}

            {localStandardItems.length > 0 ? (
              <EventsListGrid
                items={localStandardItems}
                activeFilter={activeFilter}
                totalCount={allEvents.length}
              />
            ) : (
              <p className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-5 text-sm leading-7 text-[#6b6b6b]'>
                {focusPrefecture}では現在募集中のイベントはありません
              </p>
            )}
          </section>
        ) : null}

        <section className='space-y-5'>
          {showSplit ? (
            <div className='space-y-1'>
              <p className='text-xs font-semibold tracking-[0.16em] text-[#b8956a]'>NATIONWIDE</p>
              <h2 className='text-lg font-semibold text-[#1a1a1a]'>全国のイベント</h2>
              <p className='text-sm text-[#6b6b6b]'>その他の募集中イベント</p>
            </div>
          ) : null}

          <EventsAdditionalRecruitmentSection items={nationalAdditionalItems} />

          <div className='flex items-center justify-between gap-4'>
            <p className='text-sm text-[#6b6b6b]'>
              {allEvents.length > 0 ? (
                <>
                  <span className='font-semibold text-[#1a1a1a]'>{nationalStandard.length}</span>
                  件のイベント
                  {showSplit ? '（全国）' : null}
                </>
              ) : null}
            </p>
          </div>

          <EventsListGrid
            items={nationalStandardItems}
            activeFilter={activeFilter}
            totalCount={allEvents.length}
          />
        </section>
      </div>
    </ConnectionShell>
  );
}
