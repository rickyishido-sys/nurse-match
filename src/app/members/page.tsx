import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { INSTRUCTOR_STAGE_LABEL, listUsers } from '@/lib/hanakai/data';

export default async function MembersPage() {
  const viewer = await getHanakaiViewer();
  const users = listUsers();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <h1 className='text-lg font-bold text-slate-800'>花会の仲間</h1>
        <p className='text-xs text-slate-500'>恋愛ではなく、価値観でつながる。気になる人を応援し、また花会で会いましょう。</p>
        <div className='space-y-3'>
          {users.map((user) => (
            <Link key={user.id} href={`/members/${user.id}`} className='flex items-center gap-3 rounded-3xl border border-[#eaeee6] bg-white p-3'>
              <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-full'>
                <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  {user.isCertified ? <Chip tone='gold'>認定講師</Chip> : <Chip tone='green'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>}
                </div>
                <p className='truncate text-xs text-slate-500'>{user.area}・{user.purpose}</p>
                <p className='truncate text-[11px] text-slate-400'>{user.interestTags.map((t) => `#${t}`).join(' ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </HanakaiShell>
  );
}
