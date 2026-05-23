import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/badges';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser, getChatThreads } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminRole(user.role)) {
    const state = await getAccessState(user);
    if (state === 'rejected') redirect('/rejected');
    if (state === 'suspended') redirect('/suspended');
    if (user.onboardingStatus !== 'verified') redirect('/preview');
    if (state === 'pending') redirect('/pending-review');
  }

  const threads = await getChatThreads(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-3'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>チャット一覧</h1>
          <p className='text-sm text-slate-600'>マッチが成立するとここにメッセージが表示されます。</p>
        </article>

        {threads.length === 0 ? (
          <div className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>
            マッチするとここにメッセージが表示されます。
          </div>
        ) : (
          threads.map(({ match, partner, latestMessage, unreadCount }) =>
            partner ? (
              <Link
                key={match.id}
                href={`/chat/${match.id}`}
                className='flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm'
              >
                <Image
                  src={partner.profileImageUrl}
                  alt={partner.nickname}
                  width={60}
                  height={60}
                  className='h-15 w-15 rounded-2xl object-cover'
                />
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='font-semibold text-slate-900'>{partner.nickname}</p>
                    {unreadCount > 0 ? <Badge tone='pink'>未読 {unreadCount}</Badge> : null}
                  </div>
                  <p className='line-clamp-1 text-xs text-slate-600'>{latestMessage ? latestMessage.body : 'まだメッセージはありません。'}</p>
                  <p className='text-[11px] text-slate-400'>
                    {latestMessage ? new Date(latestMessage.createdAt).toLocaleString('ja-JP') : new Date(match.createdAt).toLocaleString('ja-JP')}
                  </p>
                  {match.relationshipStatus !== 'active' ? (
                    <p className='text-[11px] text-amber-600'>
                      成立済み（削除予定: {match.scheduledDeleteAt ? new Date(match.scheduledDeleteAt).toLocaleDateString('ja-JP') : '-'}）
                    </p>
                  ) : null}
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <Badge tone={match.relationshipStatus === 'active' ? 'green' : 'amber'}>
                    {match.relationshipStatus === 'active' ? '確認済み' : '成立済み'}
                  </Badge>
                  <span className='text-[10px] text-slate-400'>プロフィール導線: チャット内</span>
                </div>
              </Link>
            ) : null,
          )
        )}
      </section>
    </AppShell>
  );
}
