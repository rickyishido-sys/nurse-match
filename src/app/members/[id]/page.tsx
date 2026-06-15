import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { connectAction } from '@/lib/hanakai/actions';
import { INSTRUCTOR_STAGE_LABEL, getUser, listPostsByAuthor } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const CONNECT_LABEL: Record<string, string> = {
  follow: 'フォロー',
  curious: '気になる',
  cheer: '応援したい',
  meet: '花会で会ってみたい',
};

export default async function MemberProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const user = getUser(id);
  if (!user) notFound();

  const viewer = await getHanakaiViewer();
  const posts = listPostsByAuthor(user.id);
  const connected = typeof sp.connected === 'string' ? sp.connected : null;

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[#eaeee6]'>
            <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-lg font-bold text-slate-800'>{user.nickname}</h1>
              {user.isCertified ? <Chip tone='gold'>認定講師</Chip> : <Chip tone='green'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>}
            </div>
            <p className='text-xs text-slate-500'>@{user.handle}・{user.area}</p>
            <div className='mt-1 flex gap-3 text-[11px] text-slate-500'>
              <span><strong className='text-slate-700'>{user.postCount}</strong> 投稿</span>
              <span><strong className='text-slate-700'>{user.followerCount}</strong> フォロワー</span>
              <span><strong className='text-slate-700'>{user.joinedEventCount}</strong> 花会参加</span>
            </div>
          </div>
        </div>

        <p className='text-sm leading-7 text-slate-600'>{user.bio}</p>
        <div className='flex flex-wrap gap-1.5'>
          <Chip tone='pink'>目的: {user.purpose}</Chip>
          {user.interestTags.map((tag) => (
            <Chip key={tag} tone='green'>#{tag}</Chip>
          ))}
        </div>

        {connected ? (
          <p className='rounded-2xl bg-[#eef4ea] px-3 py-2 text-xs text-[#4f7a4a]'>「{CONNECT_LABEL[connected] ?? connected}」を送りました。</p>
        ) : null}

        <div className='grid grid-cols-2 gap-2'>
          {(['follow', 'curious', 'cheer', 'meet'] as const).map((kind) => (
            <form key={kind} action={connectAction}>
              <input type='hidden' name='targetId' value={user.id} />
              <input type='hidden' name='kind' value={kind} />
              <button className='h-11 w-full rounded-2xl border border-[#d8e2d3] bg-white text-xs font-semibold text-[#4f7a4a]'>
                {kind === 'cheer' ? '🌸 ' : ''}{CONNECT_LABEL[kind]}
              </button>
            </form>
          ))}
        </div>

        <Card className='bg-[#f7faf5]'>
          <p className='text-xs leading-6 text-slate-600'>
            応援したいときは <Link href='/support' className='font-semibold text-[#4f7a4a]'>応援（投げ花）</Link> から、この人の挑戦を後押しできます。
          </p>
        </Card>

        <div>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>投稿</h2>
          {posts.length === 0 ? (
            <p className='text-xs text-slate-400'>まだ投稿がありません。</p>
          ) : (
            <div className='grid grid-cols-3 gap-2'>
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className='relative aspect-square overflow-hidden rounded-2xl'>
                  <Image src={post.imageUrl} alt={post.title} fill className='object-cover' />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </HanakaiShell>
  );
}
