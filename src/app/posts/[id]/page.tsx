import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { addCommentAction, likePostAction } from '@/lib/hanakai/actions';
import { getEvent, getPost, getUser, listComments } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const post = getPost(id);
  if (!post) notFound();

  const viewer = await getHanakaiViewer();
  const author = getUser(post.authorId);
  const event = post.eventId ? getEvent(post.eventId) : null;
  const comments = listComments(post.id);
  const commented = sp.commented === '1';

  return (
    <HanakaiShell viewer={viewer}>
      <article className='space-y-4'>
        <Link href={`/members/${post.authorId}`} className='flex items-center gap-2'>
          <div className='relative h-9 w-9 overflow-hidden rounded-full'>
            {author ? <Image src={author.avatarUrl} alt={author.nickname} fill className='object-cover' /> : null}
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-800'>{author?.nickname}</p>
            <p className='text-xs text-slate-400'>@{author?.handle}</p>
          </div>
        </Link>

        <div className='relative aspect-square w-full overflow-hidden rounded-3xl'>
          <Image src={post.imageUrl} alt={post.title} fill className='object-cover' />
        </div>

        <div className='space-y-2'>
          <h1 className='text-base font-bold text-slate-800'>{post.title}</h1>
          <p className='text-sm leading-7 text-slate-600'>{post.body}</p>
          <div className='flex flex-wrap gap-1.5'>
            {post.flowersUsed.map((flower) => (
              <Chip key={flower} tone='pink'>{flower}</Chip>
            ))}
            {post.tags.map((tag) => (
              <Chip key={tag} tone='green'>#{tag}</Chip>
            ))}
          </div>
          {event ? (
            <Link href={`/events/${event.id}`} className='inline-flex items-center gap-1 rounded-full bg-[#f6efdf] px-3 py-1 text-xs font-medium text-[#9b7d3f]'>
              🗓️ 参加した花会: {event.title}
            </Link>
          ) : null}
        </div>

        <div className='flex items-center gap-3 border-y border-[#eef0ec] py-3'>
          <form action={likePostAction}>
            <input type='hidden' name='postId' value={post.id} />
            <button className='rounded-full border border-[#e7d6da] bg-[#fbeef0] px-4 py-1.5 text-sm font-semibold text-[#b56b7a]'>
              ♡ いいね {post.likeCount}
            </button>
          </form>
        </div>

        <section className='space-y-3'>
          <h2 className='text-sm font-bold text-slate-800'>コメント {comments.length}</h2>
          {commented ? <p className='rounded-2xl bg-[#eef4ea] px-3 py-2 text-xs text-[#4f7a4a]'>コメントを送信しました。</p> : null}
          {comments.map((comment) => {
            const cAuthor = getUser(comment.authorId);
            return (
              <div key={comment.id} className='flex gap-2'>
                <div className='relative h-7 w-7 shrink-0 overflow-hidden rounded-full'>
                  {cAuthor ? <Image src={cAuthor.avatarUrl} alt={cAuthor.nickname} fill className='object-cover' /> : null}
                </div>
                <div className='rounded-2xl bg-[#f5f8f3] px-3 py-2'>
                  <p className='text-xs font-semibold text-slate-700'>{cAuthor?.nickname}</p>
                  <p className='text-xs leading-5 text-slate-600'>{comment.body}</p>
                </div>
              </div>
            );
          })}

          <form action={addCommentAction} className='flex gap-2'>
            <input type='hidden' name='postId' value={post.id} />
            <input
              name='body'
              placeholder='あたたかいコメントを…'
              className='flex-1 rounded-full border border-[#e0e7db] bg-white px-4 py-2 text-sm'
            />
            <button className='rounded-full bg-[#4f7a4a] px-4 text-sm font-semibold text-white'>送信</button>
          </form>
        </section>
      </article>
    </HanakaiShell>
  );
}
