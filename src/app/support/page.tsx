import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip, ProgressBar } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { formatYen, getUser, listSupportProjects } from '@/lib/hanakai/data';
import type { SupportCategory } from '@/lib/hanakai/types';

const CATEGORY_LABEL: Record<SupportCategory, string> = {
  instructor: '講師になりたい',
  area: '地域花会を立ち上げたい',
  shop: '花屋を開きたい',
  learn: '花を学びたい',
  spread: '花会を広げたい',
};

export default async function SupportPage() {
  const viewer = await getHanakaiViewer();
  const projects = listSupportProjects();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <div>
          <h1 className='text-lg font-bold text-slate-800'>応援（投げ花）</h1>
          <p className='text-xs leading-6 text-slate-500'>
            かわいい人にではなく、夢・挑戦・活動への共感で応援する。応援金の約80%が本人に届く設計です。
          </p>
        </div>

        <div className='space-y-3'>
          {projects.map((project) => {
            const owner = getUser(project.ownerId);
            return (
              <Link key={project.id} href={`/support/${project.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
                <div className='relative h-32 w-full'>
                  <Image src={project.coverUrl} alt={project.title} fill className='object-cover' />
                  <div className='absolute left-2 top-2'><Chip tone='gold'>{CATEGORY_LABEL[project.category]}</Chip></div>
                </div>
                <div className='space-y-2 p-3'>
                  <p className='text-sm font-semibold text-slate-800'>{project.title}</p>
                  <p className='text-xs text-slate-500'>{owner?.nickname}・{project.supporterCount}人が応援</p>
                  <ProgressBar value={project.raisedAmount} max={project.goalAmount} />
                  <p className='text-[11px] text-slate-500'>{formatYen(project.raisedAmount)} / {formatYen(project.goalAmount)}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>応援できる対象</h2>
          <ul className='mt-2 space-y-1 text-xs text-slate-600'>
            <li>・講師になりたい人</li>
            <li>・地域花会を立ち上げたい人</li>
            <li>・花屋を開きたい人</li>
            <li>・花を学びたい人</li>
            <li>・花会を広げたい人</li>
          </ul>
        </Card>
      </div>
    </HanakaiShell>
  );
}
