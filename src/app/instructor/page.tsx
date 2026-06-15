import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  INSTRUCTOR_STAGE_LABEL,
  INSTRUCTOR_STAGE_ORDER,
  listCertifiedInstructors,
  listInstructorCandidates,
} from '@/lib/hanakai/data';

const CRITERIA = [
  { label: '花会参加回数', icon: '🗓️' },
  { label: '投稿実績', icon: '🌸' },
  { label: '参加者レビュー', icon: '⭐️' },
  { label: '応援ポイント', icon: '💛' },
  { label: '運営貢献', icon: '🤝' },
  { label: '講師試験', icon: '📝' },
];

export default async function InstructorPage() {
  const viewer = await getHanakaiViewer();
  const candidates = listInstructorCandidates();
  const certified = listCertifiedInstructors();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-5'>
        <div>
          <h1 className='text-lg font-bold text-slate-800'>講師への道</h1>
          <p className='text-xs leading-6 text-slate-500'>参加者から、エリア責任者へ。お金だけでなく、貢献と信頼で認定される設計です。</p>
        </div>

        <Card>
          <h2 className='mb-3 text-sm font-bold text-slate-800'>育成ステップ</h2>
          <ol className='space-y-2'>
            {INSTRUCTOR_STAGE_ORDER.map((stage, idx) => (
              <li key={stage} className='flex items-center gap-3'>
                <span className='flex h-7 w-7 items-center justify-center rounded-full bg-[#eef4ea] text-xs font-bold text-[#4f7a4a]'>{idx + 1}</span>
                <span className='text-sm text-slate-700'>{INSTRUCTOR_STAGE_LABEL[stage]}</span>
                {idx < INSTRUCTOR_STAGE_ORDER.length - 1 ? <span className='text-slate-300'>→</span> : null}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h2 className='mb-3 text-sm font-bold text-slate-800'>認定の判定軸</h2>
          <div className='grid grid-cols-2 gap-2'>
            {CRITERIA.map((c) => (
              <div key={c.label} className='flex items-center gap-2 rounded-2xl bg-[#f5f8f3] px-3 py-2 text-xs text-slate-600'>
                <span>{c.icon}</span>
                {c.label}
              </div>
            ))}
          </div>
        </Card>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>講師候補</h2>
          <div className='space-y-2'>
            {candidates.map((user) => (
              <Link key={user.id} href={`/members/${user.id}`} className='flex items-center gap-3 rounded-2xl border border-[#eaeee6] bg-white p-2.5'>
                <div className='relative h-10 w-10 overflow-hidden rounded-full'>
                  <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  <p className='truncate text-xs text-slate-500'>花会{user.joinedEventCount}回・投稿{user.postCount}・応援{user.cheerPoints}pt</p>
                </div>
                <Chip tone='green'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>認定講師</h2>
          <div className='space-y-2'>
            {certified.map((user) => (
              <Link key={user.id} href={`/members/${user.id}`} className='flex items-center gap-3 rounded-2xl border border-[#f0e6cf] bg-[#fbf7ee] p-2.5'>
                <div className='relative h-10 w-10 overflow-hidden rounded-full'>
                  <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  <p className='truncate text-xs text-slate-500'>{user.area}</p>
                </div>
                <Chip tone='gold'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </HanakaiShell>
  );
}
