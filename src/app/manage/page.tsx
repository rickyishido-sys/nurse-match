import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  formatCoin,
  getUserName,
  INSTRUCTOR_STAGE_LABEL,
  listCertifiedInstructors,
  listEvents,
  listInstructorCandidates,
  listNotices,
  listPosts,
  listSupportProjects,
  listUsers,
} from '@/lib/hanakai/data';

export default async function ManagePage() {
  const viewer = await getHanakaiViewer();
  const users = listUsers();
  const posts = listPosts();
  const events = listEvents();
  const candidates = listInstructorCandidates();
  const certified = listCertifiedInstructors();
  const support = listSupportProjects();
  const notices = listNotices();
  const applications = events.reduce((sum, e) => sum + e.reservedCount, 0);

  const stats = [
    { label: 'ユーザー', value: users.length },
    { label: '投稿', value: posts.length },
    { label: 'イベント', value: events.length },
    { label: '参加申込', value: applications },
    { label: '講師候補', value: candidates.length },
    { label: '認定講師', value: certified.length },
    { label: '応援件数', value: support.reduce((s, p) => s + p.supporterCount, 0) },
    { label: '通報', value: 0 },
  ];

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-5'>
        <div>
          <h1 className='text-lg font-bold text-slate-800'>運営コンソール</h1>
          <p className='text-xs text-slate-500'>HANAKAI のユーザー・投稿・花会・応援・講師認定を管理します。</p>
        </div>

        {!viewer ? (
          <Card className='bg-[#fbeef0]'>
            <p className='text-xs text-slate-600'>運営機能の利用にはログインが必要です。</p>
            <Link href='/login' className='mt-2 inline-block rounded-full bg-[#4f7a4a] px-3 py-1.5 text-xs font-semibold text-white'>ログイン</Link>
          </Card>
        ) : null}

        <div className='grid grid-cols-4 gap-2'>
          {stats.map((stat) => (
            <Card key={stat.label} className='p-3 text-center'>
              <p className='text-lg font-bold text-[#4f7a4a]'>{stat.value}</p>
              <p className='text-[10px] text-slate-500'>{stat.label}</p>
            </Card>
          ))}
        </div>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>講師候補の審査</h2>
          <div className='space-y-2'>
            {candidates.map((user) => (
              <Card key={user.id} className='flex items-center justify-between p-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  <p className='truncate text-[11px] text-slate-500'>花会{user.joinedEventCount}回・投稿{user.postCount}・応援{user.cheerPoints}pt</p>
                </div>
                <div className='flex shrink-0 gap-1.5'>
                  <Chip tone='green'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>
                  <button className='rounded-full bg-[#4f7a4a] px-3 py-1 text-[11px] font-semibold text-white'>認定</button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>応援プロジェクト</h2>
          <div className='space-y-2'>
            {support.map((project) => (
              <Card key={project.id} className='flex items-center justify-between p-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{project.title}</p>
                  <p className='truncate text-[11px] text-slate-500'>{getUserName(project.ownerId)}・{project.supporterCount}人</p>
                </div>
                <p className='shrink-0 text-xs font-bold text-[#9b7d3f]'>{formatCoin(project.raisedCoins)}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>お知らせ</h2>
          <div className='space-y-2'>
            {notices.map((notice) => (
              <Card key={notice.id} className='p-3'>
                <p className='text-sm font-semibold text-slate-800'>{notice.title}</p>
                <p className='mt-0.5 text-xs text-slate-500'>{notice.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </HanakaiShell>
  );
}
