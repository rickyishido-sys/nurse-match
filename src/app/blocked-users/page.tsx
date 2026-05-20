import Image from 'next/image';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getBlockedUsers, getCurrentUser } from '@/lib/data';

export default async function BlockedUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const blockedUsers = await getBlockedUsers(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>ブロック管理</h1>
        <p className='text-sm leading-7 text-slate-600'>
          ブロックした相手は候補・マッチ・チャットに表示されません。メッセージ送信も不可になります。
        </p>

        {blockedUsers.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500'>
            ブロック中ユーザーはいません。
          </div>
        ) : (
          <ul className='space-y-2'>
            {blockedUsers.map(({ block, blockedUser }) =>
              blockedUser ? (
                <li key={block.id} className='flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3'>
                  <Image
                    src={blockedUser.profileImageUrl}
                    alt={blockedUser.nickname}
                    width={48}
                    height={48}
                    className='h-12 w-12 rounded-xl object-cover'
                  />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>{blockedUser.nickname}</p>
                    <p className='text-xs text-slate-500'>ブロック日時: {new Date(block.createdAt).toLocaleString('ja-JP')}</p>
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
