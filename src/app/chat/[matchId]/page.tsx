import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { ChatBox } from '@/components/chat-box';
import { MatchRelationshipActions } from '@/components/match-relationship-actions';
import { blockUserAction, createReportAction } from '@/lib/actions';
import { getChat, getCurrentUser } from '@/lib/data';
import { getAccessState } from '@/lib/guard';

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role !== 'admin') {
    const state = await getAccessState(user);
    if (state === 'pending') redirect('/pending-review');
    if (state === 'rejected') redirect('/rejected');
    if (state === 'suspended') redirect('/suspended');
  }

  const { matchId } = await params;
  const { match, messages } = await getChat(matchId);
  if (!match) notFound();

  const isMember = match.userAId === user.id || match.userBId === user.id || user.role === 'admin';
  if (!isMember) notFound();

  const partnerId = match.userAId === user.id ? match.userBId : match.userAId;
  const isRelationshipMode = match.relationshipStatus !== 'active';

  return (
    <AppShell user={user}>
      <section className='space-y-3'>
        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-lg font-bold text-slate-900'>チャット</h1>
              <p className='text-xs text-slate-500'>
                {isRelationshipMode ? '成立済みのためチャット凍結中' : 'マッチ済みユーザーのみ'}
              </p>
            </div>
            <Badge tone={isRelationshipMode ? 'amber' : 'green'}>
              {isRelationshipMode ? '成立済み' : '確認済みユーザー'}
            </Badge>
          </div>

          <div className='grid grid-cols-3 gap-2 text-[11px]'>
            <form action={createReportAction}>
              <input type='hidden' name='reporterId' value={user.id} />
              <input type='hidden' name='targetUserId' value={partnerId} />
              <input type='hidden' name='reason' value='チャットから通報' />
              <input type='hidden' name='reasonType' value='harassment' />
              <input type='hidden' name='detail' value='チャット画面からの通報です' />
              <button className='w-full rounded-lg border border-slate-300 bg-white px-2 py-2'>通報</button>
            </form>

            <form action={blockUserAction}>
              <input type='hidden' name='blockerUserId' value={user.id} />
              <input type='hidden' name='blockedUserId' value={partnerId} />
              <button className='w-full rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-red-700'>ブロック</button>
            </form>

            <Link href='/community-guidelines' className='rounded-lg border border-slate-200 px-2 py-2 text-center text-slate-600'>
              ガイド
            </Link>
          </div>

          <MatchRelationshipActions matchId={matchId} actorUserId={user.id} disabled={isRelationshipMode} />
          <p className='text-[11px] leading-5 text-slate-500'>
            この相手とのマッチングを成立済みにします。プライバシー保護のため、プロフィール・チャットは非公開化され、一定期間後に削除対象になります。
          </p>
        </article>

        <ChatBox matchId={matchId} user={user} messages={messages} frozen={isRelationshipMode} />
      </section>
    </AppShell>
  );
}
