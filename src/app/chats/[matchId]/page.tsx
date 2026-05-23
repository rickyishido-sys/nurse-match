import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { ChatThreadView } from '@/components/chat-thread-view';
import { blockUserAction, createReportAction } from '@/lib/actions';
import { getChat, getChatThreads, getCurrentUser, getMatchReadMap, markMatchAsRead } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

export default async function ChatDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
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

  const thread = (await getChatThreads(user.id)).find((row) => row.match.id === matchId);
  const partner = thread?.partner ?? null;
  if (!partner) notFound();

  await markMatchAsRead(matchId, user.id);
  const readMap = await getMatchReadMap(matchId);
  const partnerLastReadAt = readMap[partner.id] ?? null;
  const isRelationshipMode = match.relationshipStatus !== 'active';

  return (
    <AppShell user={user}>
      <section className='space-y-3'>
        <article className='rounded-3xl border border-slate-100 bg-white p-3 shadow-sm'>
          <div className='flex items-center gap-3'>
            <Image src={partner.profileImageUrl} alt={partner.nickname} width={52} height={52} className='h-13 w-13 rounded-2xl object-cover' />
            <div className='flex-1'>
              <p className='font-semibold text-slate-900'>{partner.nickname}さん</p>
              <p className='text-xs text-slate-500'>安心して丁寧に会話しましょう</p>
            </div>
            <details className='relative'>
              <summary className='cursor-pointer list-none rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600'>メニュー</summary>
              <div className='absolute right-0 z-10 mt-2 w-[250px] rounded-2xl border border-slate-100 bg-white p-3 shadow-xl'>
                <p className='mb-2 text-xs font-semibold text-slate-700'>通報 / ブロック</p>
                <form action={createReportAction} className='space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs'>
                  <input type='hidden' name='reporterId' value={user.id} />
                  <input type='hidden' name='targetUserId' value={partner.id} />
                  <select name='reasonType' defaultValue='harassment' className='h-8 w-full rounded-lg border border-slate-300 bg-white px-2'>
                    <option value='harassment'>不適切な発言</option>
                    <option value='spam'>勧誘</option>
                    <option value='fake_profile'>なりすまし</option>
                    <option value='dangerous'>不快行為</option>
                    <option value='other'>その他</option>
                  </select>
                  <input name='reason' defaultValue='チャットから通報' className='h-8 w-full rounded-lg border border-slate-300 bg-white px-2' />
                  <input name='detail' placeholder='詳細（任意）' className='h-8 w-full rounded-lg border border-slate-300 bg-white px-2' />
                  <button className='h-8 w-full rounded-lg border border-slate-300 bg-white'>通報する</button>
                </form>
                <form action={blockUserAction} className='mt-2'>
                  <input type='hidden' name='blockerUserId' value={user.id} />
                  <input type='hidden' name='blockedUserId' value={partner.id} />
                  <button className='h-8 w-full rounded-lg border border-red-200 bg-red-50 text-xs text-red-700'>この相手をブロック</button>
                </form>
              </div>
            </details>
          </div>
          <div className='mt-2 flex items-center gap-2'>
            <Badge tone={isRelationshipMode ? 'amber' : 'green'}>{isRelationshipMode ? '成立済み' : '会話中'}</Badge>
            <Link href='/community-guidelines' className='text-[11px] text-slate-500 underline'>
              ガイドを見る
            </Link>
          </div>
        </article>

        <ChatThreadView matchId={matchId} user={user} messages={messages} frozen={isRelationshipMode} partnerLastReadAt={partnerLastReadAt} />
      </section>
    </AppShell>
  );
}
