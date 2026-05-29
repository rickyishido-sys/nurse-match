import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getActivityFeed, getCurrentUser } from '@/lib/data';
import { getAccessState } from '@/lib/guard';

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  const feed = await getActivityFeed(user.id);
  const rows = feed.matches;

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-pink-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>マッチ一覧</h1>
          <p className='mt-1 text-sm text-slate-600'>相互興味でマッチした相手のみ表示されます。</p>
        </article>
        {rows.length === 0 ? (
          <article className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>まだマッチはありません。</article>
        ) : (
          rows.map((row) => (
            <Link key={row.matchId} href={`/messages/${row.matchId}`} className='block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
              <div className='flex items-center gap-3'>
                <div className='relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl border border-slate-200'>
                  <Image src={row.user.profileImageUrl} alt={row.user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-slate-900'>{row.user.nickname}</p>
                  <p className='line-clamp-1 text-xs text-slate-500'>{row.latestMessage ?? 'メッセージを始めましょう。'}</p>
                  <p className='mt-1 text-[11px] text-slate-400'>マッチ日時: {new Date(row.matchedAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </AppShell>
  );
}
