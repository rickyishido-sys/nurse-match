import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, ProgressBar } from '@/components/hanakai/ui';
import { cheerAction } from '@/lib/hanakai/actions';
import { formatYen, getSupportProject, getUser } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const AMOUNTS = [500, 1000, 3000, 5000];

export default async function SupportDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const project = getSupportProject(id);
  if (!project) notFound();

  const viewer = await getHanakaiViewer();
  const owner = getUser(project.ownerId);
  const cheered = sp.cheered === '1';
  const payoutPct = Math.round(project.payoutRate * 100);

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <div className='relative h-44 w-full overflow-hidden rounded-3xl'>
          <Image src={project.coverUrl} alt={project.title} fill className='object-cover' priority />
        </div>

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

        {cheered ? <p className='rounded-2xl bg-[#f6efdf] px-3 py-2 text-sm text-[#9b7d3f]'>応援（投げ花）を贈りました。ありがとうございます。</p> : null}

        <Card className='bg-[#f7faf5]'>
          <h2 className='text-sm font-bold text-slate-800'>🌸 花を贈って応援する</h2>
          <p className='mt-1 text-[11px] text-slate-500'>応援金の約{payoutPct}%が本人に届きます（決済は準備中のモックです）。</p>
          <div className='mt-3 grid grid-cols-4 gap-2'>
            {AMOUNTS.map((amount) => (
              <form key={amount} action={cheerAction}>
                <input type='hidden' name='projectId' value={project.id} />
                <input type='hidden' name='amount' value={amount} />
                <button className='h-11 w-full rounded-2xl border border-[#e0d4b6] bg-white text-xs font-bold text-[#9b7d3f]'>
                  ¥{amount.toLocaleString('ja-JP')}
                </button>
              </form>
            ))}
          </div>
        </Card>
      </article>
    </HanakaiShell>
  );
}
