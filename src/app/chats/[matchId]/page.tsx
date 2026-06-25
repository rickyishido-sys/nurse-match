import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { ChatThreadView } from '@/components/chat-thread-view';
import { UserSafetyMenu } from '@/components/user-safety-menu';
import { getChat, getChatThreads, getCurrentUser, getMatchReadMap, markMatchAsRead } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

export default async function ChatDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminRole(user.role)) {
    const state = await getAccessState(user);
    if (state === 'rejected') redirect('/review-rejected');
    if (state === 'suspended') redirect('/suspended');
    if (user.onboardingStatus !== 'verified') redirect('/onboarding-preview');
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
            <UserSafetyMenu reporterId={user.id} targetUserId={partner.id} />
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
