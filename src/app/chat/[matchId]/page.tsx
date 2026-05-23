import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { ChatBox } from '@/components/chat-box';
import { MatchRelationshipActions } from '@/components/match-relationship-actions';
import { blockUserAction, createReportAction } from '@/lib/actions';
import { getChat, getCurrentUser, markMatchAsRead } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminRole(user.role)) {
    const state = await getAccessState(user);
    if (state === 'rejected') redirect('/rejected');
    if (state === 'suspended') redirect('/suspended');
    if (user.onboardingStatus !== 'verified') redirect('/preview');
    if (state === 'pending') redirect('/pending-review');
  }

  const { matchId } = await params;
  const { match, messages } = await getChat(matchId);
  if (!match) notFound();

  const isMember = match.userAId === user.id || match.userBId === user.id || isAdminRole(user.role);
  if (!isMember) notFound();

  const partnerId = match.userAId === user.id ? match.userBId : match.userAId;
  const isRelationshipMode = match.relationshipStatus !== 'active';
  await markMatchAsRead(matchId, user.id);

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

          <div className='grid grid-cols-1 gap-2 text-[11px]'>
            <form action={createReportAction} className='grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2'>
              <input type='hidden' name='reporterId' value={user.id} />
              <input type='hidden' name='targetUserId' value={partnerId} />
              <select name='reasonType' defaultValue='harassment' className='h-9 rounded-lg border border-slate-300 bg-white px-2'>
                <option value='harassment'>不適切な発言</option>
                <option value='spam'>勧誘</option>
                <option value='fake_profile'>なりすまし</option>
                <option value='dangerous'>不快行為</option>
                <option value='other'>その他</option>
              </select>
              <input name='reason' defaultValue='チャットから通報' className='h-9 rounded-lg border border-slate-300 bg-white px-2' />
              <input name='detail' placeholder='詳細（任意）' className='col-span-2 h-9 rounded-lg border border-slate-300 bg-white px-2' />
              <button className='col-span-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-2'>通報する</button>
            </form>
            <form action={blockUserAction}>
              <input type='hidden' name='blockerUserId' value={user.id} />
              <input type='hidden' name='blockedUserId' value={partnerId} />
              <button className='w-full rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-red-700'>この相手をブロック</button>
            </form>
            <Link href='/community-guidelines' className='rounded-lg border border-slate-200 px-2 py-2 text-center text-slate-600'>
              ガイド
            </Link>
          </div>
          <div className='rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600'>
            外部連絡先への移行は双方合意後に行ってください（将来: 既読/移行ログ機能を追加予定）。
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
