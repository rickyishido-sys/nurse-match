import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/badges';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser, getMatches } from '@/lib/data';
import { getAccessState } from '@/lib/guard';

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role !== 'admin') {
    const state = await getAccessState(user);
    if (state === 'pending') redirect('/pending-review');
    if (state === 'rejected') redirect('/rejected');
    if (state === 'suspended') redirect('/suspended');
  }

  const matches = await getMatches(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-3'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>マッチ一覧</h1>
          <p className='text-sm text-slate-600'>マッチ済み相手とのみチャット可能です。</p>
        </article>

        {matches.length === 0 ? (
          <div className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>
            マッチはまだありません。
          </div>
        ) : (
          matches.map(({ match, partner }) =>
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
                  <p className='font-semibold text-slate-900'>{partner.nickname}</p>
                  <p className='text-xs text-slate-500'>{match.relationshipStatus === 'active' ? partner.location : 'プロフィール非公開'}</p>
                  {match.relationshipStatus !== 'active' ? (
                    <p className='text-[11px] text-amber-600'>
                      成立済み（削除予定: {match.scheduledDeleteAt ? new Date(match.scheduledDeleteAt).toLocaleDateString('ja-JP') : '-'}）
                    </p>
                  ) : null}
                </div>
                <Badge tone={match.relationshipStatus === 'active' ? 'green' : 'amber'}>
                  {match.relationshipStatus === 'active' ? '本人確認済み' : '成立済み'}
                </Badge>
              </Link>
            ) : null,
          )
        )}
      </section>
    </AppShell>
  );
}
