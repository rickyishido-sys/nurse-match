import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { CycleDiagram } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { listUpcomingEvents, listLatestPosts, getUserName, formatEventDate, CYCLE_STEPS } from '@/lib/hanakai/data';

const heroImg = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=70';

export default async function LandingPage() {
  const viewer = await getHanakaiViewer();
  const events = listUpcomingEvents(2);
  const posts = listLatestPosts(3);

  return (
    <HanakaiShell viewer={viewer}>
      <section className='space-y-5'>
        <div className='relative overflow-hidden rounded-[28px] border border-[#e7ede3]'>
          <div className='relative h-56 w-full'>
            <Image src={heroImg} alt='花会の様子' fill className='object-cover' priority />
            <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent' />
          </div>
          <div className='absolute bottom-0 left-0 right-0 p-5 text-white'>
            <p className='text-xs font-semibold tracking-[0.3em] text-white/80'>HANAKAI ・ 花会</p>
            <h1 className='mt-1 text-2xl font-bold leading-tight'>
              花をいけ、人と出会い、
              <br />
              また会いたくなる。
            </h1>
            <p className='mt-2 text-xs leading-5 text-white/90'>
              リアルの花会で花をいけ、語らう。アプリで作品や想いを知り、気になる人とまたリアルで会う。
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Link href='/register' className='flex h-12 items-center justify-center rounded-2xl bg-[#4f7a4a] text-sm font-bold text-white'>
            花会をはじめる
          </Link>
          <Link href='/home' className='flex h-12 items-center justify-center rounded-2xl border border-[#d8e2d3] bg-white text-sm font-bold text-[#4f7a4a]'>
            まず見てみる
          </Link>
        </div>

        <article className='rounded-3xl border border-[#eaeee6] bg-white p-5'>
          <h2 className='text-sm font-bold text-slate-800'>花会は、花教室ではありません。</h2>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            SNSのようにただ繋がるだけでもありません。リアルの体験を起点に、関係性がゆっくり深まる新しいコミュニケーションの形です。
            「リアル → デジタル → リアル」の循環で、花会28万人構想を目指します。
          </p>
          <Link href='/concept' className='mt-3 inline-block text-xs font-semibold text-[#4f7a4a]'>
            花会28万人構想を読む ›
          </Link>
        </article>

        <CycleDiagram steps={CYCLE_STEPS} />

        <div>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='text-sm font-bold text-slate-800'>近日開催の花会</h2>
            <Link href='/events' className='text-xs font-semibold text-[#4f7a4a]'>一覧 ›</Link>
          </div>
          <div className='space-y-3'>
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className='flex gap-3 rounded-3xl border border-[#eaeee6] bg-white p-3'>
                <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl'>
                  <Image src={event.coverUrl} alt={event.title} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{event.title}</p>
                  <p className='mt-0.5 text-xs text-slate-500'>{formatEventDate(event.startAt)}</p>
                  <p className='text-xs text-slate-500'>{event.area}・{getUserName(event.hostId)}先生</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='text-sm font-bold text-slate-800'>新着の作品</h2>
            <Link href='/posts' className='text-xs font-semibold text-[#4f7a4a]'>一覧 ›</Link>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className='relative aspect-square overflow-hidden rounded-2xl'>
                <Image src={post.imageUrl} alt={post.title} fill className='object-cover' />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </HanakaiShell>
  );
}
