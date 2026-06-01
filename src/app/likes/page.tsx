import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { respondToIncomingLikeSubmitAction } from '@/lib/actions';
import { getCurrentUser, getIncomingLikesBySwipes } from '@/lib/data';
import { getAccessState } from '@/lib/guard';

export default async function LikesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.gender !== 'male') redirect('/home/female');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  const incoming = (await getIncomingLikesBySwipes(user.id)).filter((row) => row.user.gender === 'female');

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-pink-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>興味を持たれました</h1>
          <p className='mt-1 text-sm text-slate-600'>あなたに興味ありを送った女性を表示します。</p>
        </article>

        {incoming.length === 0 ? (
          <article className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>まだ興味ありは届いていません。</article>
        ) : (
          incoming.map((row) => (
            <article key={row.user.id} className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
              <div className='flex gap-3'>
                <div className='relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl border border-slate-200'>
                  <Image src={row.user.profileImageUrl} alt={row.user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-base font-semibold text-slate-900'>
                    {row.user.nickname}・{row.user.age}
                  </p>
                  <p className='text-xs text-slate-600'>{row.user.location}</p>
                  <p className='mt-1 line-clamp-2 text-xs text-slate-500'>{row.user.bio}</p>
                  <p className='mt-1 text-[11px] text-slate-400'>{new Date(row.sentAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <form action={respondToIncomingLikeSubmitAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={row.user.id} />
                  <input type='hidden' name='action' value='like' />
                  <button className='h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white'>興味ありを返す</button>
                </form>
                <form action={respondToIncomingLikeSubmitAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={row.user.id} />
                  <input type='hidden' name='action' value='skip' />
                  <button className='h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700'>スキップ</button>
                </form>
              </div>
            </article>
          ))
        )}

        <Link href='/matches' className='inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>
          マッチ一覧を見る
        </Link>
      </section>
    </AppShell>
  );
}

