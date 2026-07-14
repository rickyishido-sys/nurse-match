import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ManageNav } from '@/components/connection/manage-nav';
import { listExperienceRequestGroups } from '@/lib/connection/experience-request';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export const metadata = {
  title: '体験リクエスト管理',
  robots: { index: false, follow: false },
};

export default async function ManageExperienceRequestsPage() {
  const viewer = await getHanakaiViewer();
  const groups = await listExperienceRequestGroups();

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: '#b8956a' }}>
            ADMIN
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>体験リクエスト</h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            ユーザーの「参加したい」が集まった需要を確認し、新しいイベント企画の参考にできます。
          </p>
        </div>

        <ManageNav active='experience-requests' />

        {groups.length === 0 ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-8 text-center text-sm text-[#9a9a9a]'>
            まだ体験リクエストはありません。
          </p>
        ) : (
          <ul className='space-y-3'>
            {groups.map((g) => {
              const href = `/manage/experience-requests/detail?category=${encodeURIComponent(g.category)}&prefecture=${encodeURIComponent(g.prefecture)}&city=${encodeURIComponent(g.city)}`;
              return (
                <li key={`${g.category}-${g.prefecture}-${g.city}`}>
                  <Link
                    href={href}
                    prefetch
                    className='flex items-center justify-between rounded-2xl border border-[#ebe9e4] bg-white px-5 py-4 transition hover:border-[#1f5d4f]/30 hover:shadow-sm active:scale-[0.99]'
                  >
                    <div>
                      <p className='text-sm font-semibold text-[#1a1a1a]'>
                        {g.category}
                        <span className='mx-2 text-[#d8d6d1]'>·</span>
                        {g.city}
                      </p>
                      <p className='mt-1 text-xs text-[#9a9a9a]'>{g.prefecture}</p>
                    </div>
                    <span className='rounded-full bg-[#f3f7f5] px-3 py-1 text-xs font-bold text-[#1f5d4f]'>
                      {g.count}件
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ConnectionShell>
  );
}
