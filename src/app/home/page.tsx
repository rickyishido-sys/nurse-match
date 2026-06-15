import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip, CycleDiagram, ProgressBar, SectionHeading } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  CYCLE_STEPS,
  formatCoin,
  formatEventDate,
  formatYen,
  getUser,
  getUserName,
  INSTRUCTOR_STAGE_LABEL,
  listFeaturedLives,
  listFeaturedSupport,
  listLatestPosts,
  listRecommendedEvents,
  listRecommendedUsers,
  listUpcomingEvents,
} from '@/lib/hanakai/data';

export default async function HomePage() {
  const viewer = await getHanakaiViewer();
  const upcoming = listUpcomingEvents(3);
  const recommended = listRecommendedEvents(3);
  const posts = listLatestPosts(6);
  const recommendedUsers = listRecommendedUsers(4);
  const lives = listFeaturedLives(3);
  const support = listFeaturedSupport(2);

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-6'>
        <section className='rounded-3xl bg-gradient-to-br from-[#eef4ea] to-[#fbeef0] p-5'>
          <p className='text-xs font-semibold tracking-[0.2em] text-[#4f7a4a]'>ようこそ、花会へ</p>
          <h1 className='mt-1 text-lg font-bold text-slate-800'>今日も、花とひとに会いにいこう。</h1>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            リアルの花会で出会い、ここで想いを知り、また会う。その循環で<strong className='text-[#4f7a4a]'>花会28万人構想</strong>へ。
          </p>
          <Link href='/concept' className='mt-2 inline-block text-xs font-semibold text-[#4f7a4a]'>構想を読む ›</Link>
        </section>

        <section>
          <SectionHeading title='花会の循環' action={{ href: '/concept', label: '構想' }} />
          <CycleDiagram steps={CYCLE_STEPS} variant='compact' />
        </section>

        <section>
          <SectionHeading title='近日開催の花会' action={{ href: '/events', label: 'すべて' }} />
          <div className='space-y-3'>
            {upcoming.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className='flex gap-3 rounded-3xl border border-[#eaeee6] bg-white p-3'>
                <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl'>
                  <Image src={event.coverUrl} alt={event.title} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate text-sm font-semibold text-slate-800'>{event.title}</p>
                    {event.status === 'full' ? <Chip tone='gray'>満席</Chip> : event.status === 'almost_full' ? <Chip tone='pink'>残りわずか</Chip> : null}
                  </div>
                  <p className='mt-0.5 text-xs text-slate-500'>{formatEventDate(event.startAt)}</p>
                  <p className='text-xs text-slate-500'>{event.area}・{getUserName(event.hostId)}先生</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='おすすめの花会' action={{ href: '/events', label: 'すべて' }} />
          <div className='-mx-4 flex gap-3 overflow-x-auto px-4 pb-1'>
            {recommended.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className='w-44 shrink-0'>
                <div className='relative h-28 w-full overflow-hidden rounded-2xl'>
                  <Image src={event.coverUrl} alt={event.title} fill className='object-cover' />
                </div>
                <p className='mt-1.5 line-clamp-2 text-xs font-semibold text-slate-800'>{event.title}</p>
                <p className='text-[11px] text-slate-500'>{event.area}・{formatYen(event.fee)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='新着の作品' action={{ href: '/posts', label: 'すべて' }} />
          <div className='grid grid-cols-3 gap-2'>
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className='relative aspect-square overflow-hidden rounded-2xl'>
                <Image src={post.imageUrl} alt={post.title} fill className='object-cover' />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='おすすめの仲間' action={{ href: '/members', label: 'すべて' }} />
          <div className='-mx-4 flex gap-3 overflow-x-auto px-4 pb-1'>
            {recommendedUsers.map((user) => (
              <Link key={user.id} href={`/members/${user.id}`} className='w-28 shrink-0 text-center'>
                <div className='relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-[#eaeee6]'>
                  <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
                </div>
                <p className='mt-1.5 truncate text-xs font-semibold text-slate-800'>{user.nickname}</p>
                <p className='truncate text-[10px] text-[#9b7d3f]'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='注目のライブ' action={{ href: '/lives', label: 'すべて' }} />
          <div className='space-y-3'>
            {lives.map((live) => (
              <Link key={live.id} href={`/lives/${live.id}`} className='flex gap-3 rounded-3xl border border-[#eaeee6] bg-white p-3'>
                <div className='relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl'>
                  <Image src={live.coverUrl} alt={live.title} fill className='object-cover' />
                  {live.isLiveNow ? (
                    <span className='absolute left-1 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white'>LIVE</span>
                  ) : null}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='line-clamp-2 text-sm font-semibold text-slate-800'>{live.title}</p>
                  <p className='mt-0.5 text-xs text-slate-500'>{getUserName(live.hostId)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='応援したい挑戦' action={{ href: '/support', label: 'すべて' }} />
          <div className='space-y-3'>
            {support.map((project) => {
              const owner = getUser(project.ownerId);
              return (
                <Link key={project.id} href={`/support/${project.id}`} className='block rounded-3xl border border-[#eaeee6] bg-white p-3'>
                  <div className='flex gap-3'>
                    <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl'>
                      <Image src={project.coverUrl} alt={project.title} fill className='object-cover' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='line-clamp-2 text-sm font-semibold text-slate-800'>{project.title}</p>
                      <p className='mt-0.5 text-xs text-slate-500'>{owner?.nickname}・{project.supporterCount}人が応援</p>
                    </div>
                  </div>
                  <div className='mt-2'>
                    <ProgressBar value={project.raisedCoins} max={project.goalCoins} />
                    <p className='mt-1 text-[11px] text-slate-500'>{formatCoin(project.raisedCoins)} / 目標 {formatCoin(project.goalCoins)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </HanakaiShell>
  );
}
