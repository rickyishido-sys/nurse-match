import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/badges';
import { AppShell } from '@/components/app-shell';
import { UserSafetyMenu } from '@/components/user-safety-menu';
import { getChatThreads, getCurrentUser } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

function displayDate(value: string) {
  return new Date(value).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function ChatsPage() {
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
          <p className='text-sm text-slate-600'>落ち着いて会話できる相手だけを表示します。</p>
        </article>

        {threads.length === 0 ? (
          <div className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>
            マッチした相手との会話がここに表示されます
          </div>
        ) : (
          threads.map(({ match, partner, latestMessage, unreadCount }) =>
            partner ? (
              <article key={match.id} className='rounded-2xl border border-slate-100 bg-white p-3 shadow-sm'>
                <div className='flex items-center gap-3'>
                  <Image src={partner.profileImageUrl} alt={partner.nickname} width={64} height={64} className='h-16 w-16 rounded-2xl object-cover' />
                  <Link href={`/chats/${match.id}`} className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate font-semibold text-slate-900'>{partner.nickname}</p>
                      {unreadCount > 0 ? <Badge tone='pink'>未読 {unreadCount}</Badge> : null}
                    </div>
                    <p className='line-clamp-1 text-xs text-slate-600'>{latestMessage?.body ?? '会話をはじめましょう。'}</p>
                    <p className='text-[11px] text-slate-400'>{displayDate(latestMessage?.createdAt ?? match.createdAt)}</p>
                  </Link>
                  <UserSafetyMenu reporterId={user.id} targetUserId={partner.id} compact />
                </div>
              </article>
            ) : null,
          )
        )}
      </section>
    </AppShell>
  );
}
