import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { getUser, listPosts } from '@/lib/hanakai/data';

export default async function PostsPage() {
  const viewer = await getHanakaiViewer();
  const posts = listPosts();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-lg font-bold text-slate-800'>作品の投稿</h1>
          <Link href='/posts/new' className='rounded-full bg-[#4f7a4a] px-3 py-1.5 text-xs font-semibold text-white'>
            投稿する
          </Link>
        </div>

        <div className='space-y-5'>
          {posts.map((post) => {
            const author = getUser(post.authorId);
            return (
              <article key={post.id} className='overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
                <Link href={`/members/${post.authorId}`} className='flex items-center gap-2 px-3 py-2.5'>
                  <div className='relative h-8 w-8 overflow-hidden rounded-full'>
                    {author ? <Image src={author.avatarUrl} alt={author.nickname} fill className='object-cover' /> : null}
                  </div>
                  <span className='text-sm font-semibold text-slate-800'>{author?.nickname}</span>
                  <span className='text-xs text-slate-400'>@{author?.handle}</span>
                </Link>
                <Link href={`/posts/${post.id}`} className='relative block aspect-square w-full'>
                  <Image src={post.imageUrl} alt={post.title} fill className='object-cover' />
                </Link>
                <div className='space-y-2 p-3'>
                  <p className='text-sm font-semibold text-slate-800'>{post.title}</p>
                  <p className='line-clamp-2 text-xs leading-6 text-slate-600'>{post.body}</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {post.flowersUsed.map((flower) => (
                      <Chip key={flower} tone='pink'>{flower}</Chip>
                    ))}
                    {post.tags.map((tag) => (
                      <Chip key={tag} tone='green'>#{tag}</Chip>
                    ))}
                  </div>
                  <div className='flex items-center gap-4 pt-1 text-xs text-slate-500'>
                    <span>♡ {post.likeCount}</span>
                    <Link href={`/posts/${post.id}`} className='text-[#4f7a4a]'>コメントを見る ›</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </HanakaiShell>
  );
}
