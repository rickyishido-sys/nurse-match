import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip, ProgressBar, ThrowFlowerMenu } from '@/components/hanakai/ui';
import { cheerAction } from '@/lib/hanakai/actions';
import { formatYen, getSupportProject, getUser, SUPPORT_CATEGORY_LABEL, THROW_FLOWER_TIERS } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupportDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const project = getSupportProject(id);
  if (!project) notFound();

  const viewer = await getHanakaiViewer();
  const owner = getUser(project.ownerId);
  const cheeredAmount = sp.cheered ? Number(sp.cheered) : 0;
  const payoutPct = Math.round(project.payoutRate * 100);

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <div className='relative h-44 w-full overflow-hidden rounded-3xl'>
          <Image src={project.coverUrl} alt={project.title} fill className='object-cover' priority />
        </div>

        <Chip tone='gold'>{SUPPORT_CATEGORY_LABEL[project.category]}</Chip>
        <h1 className='text-lg font-bold text-slate-800'>{project.title}</h1>
        {owner ? (
          <Link href={`/members/${owner.id}`} className='inline-flex items-center gap-2'>
            <div className='relative h-7 w-7 overflow-hidden rounded-full'>
              <Image src={owner.avatarUrl} alt={owner.nickname} fill className='object-cover' />
            </div>
            <span className='text-sm text-slate-600'>{owner.nickname}</span>
          </Link>
        ) : null}

        <Card>
          <ProgressBar value={project.raisedAmount} max={project.goalAmount} />
          <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
            <span className='text-base font-bold text-[#4f7a4a]'>{formatYen(project.raisedAmount)}</span>
            <span>目標 {formatYen(project.goalAmount)}・{project.supporterCount}人</span>
          </div>
        </Card>

        <p className='text-sm leading-7 text-slate-600'>{project.story}</p>

        {cheeredAmount > 0 ? (
          <p className='rounded-2xl bg-[#f6efdf] px-3 py-2 text-sm text-[#9b7d3f]'>
            🌸 {formatYen(cheeredAmount)}の投げ花を贈りました。挑戦への応援、ありがとうございます。
          </p>
        ) : null}

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>🌸 花を贈って応援する</h2>
          <p className='mt-1 text-[11px] text-slate-500'>夢・挑戦への共感で応援しましょう。</p>
          <div className='mt-3'>
            <ThrowFlowerMenu
              tiers={THROW_FLOWER_TIERS}
              action={cheerAction}
              hiddenFields={{ projectId: project.id }}
              payoutPct={payoutPct}
            />
          </div>
        </Card>
      </article>
    </HanakaiShell>
  );
}
