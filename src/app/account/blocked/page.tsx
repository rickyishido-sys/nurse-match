import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { Card } from '@/components/connection/ui';
import { unblockMemberAction } from '@/lib/connection/block-actions';
import { listBlocks } from '@/lib/connection/block-repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export const metadata = {
  title: 'ブロック一覧',
  robots: { index: false, follow: false },
};

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AccountBlockedPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const memberId = await getViewerMemberId();
  const sp = searchParams ? await searchParams : {};
  const unblocked = sp.unblocked === '1';

  if (!memberId) {
    return (
      <ConnectionShell viewer={viewer} showNav={false}>
        <Card className='text-center'>
          <p className='text-sm text-[#6b6b6b]'>ログインが必要です。</p>
          <Link href='/login?next=/account/blocked' className='mt-4 inline-block text-sm font-semibold text-[#1f5d4f] underline'>
            ログイン
          </Link>
        </Card>
      </ConnectionShell>
    );
  }

  const blocks = await listBlocks(memberId);
  const members = await Promise.all(blocks.map((b) => getMember(b.blockedMemberId)));

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-[520px] space-y-6'>
        <div>
          <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>SAFETY</p>
          <h1 className='mt-1 text-xl font-semibold text-[#1a1a1a]'>ブロック一覧</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            ブロックしたメンバーは、プロフィールや交流導線に表示されません。相手への通知はありません。
          </p>
        </div>

        {unblocked ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>ブロックを解除しました。</p>
        ) : null}

        {blocks.length === 0 ? (
          <Card>
            <p className='text-sm text-[#9a9a9a]'>ブロックしているメンバーはいません。</p>
            <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>他のメンバーのプロフィールからブロックできます。</p>
          </Card>
        ) : (
          <div className='space-y-3'>
            {blocks.map((block, index) => {
              const member = members[index];
              if (!member) return null;
              return (
                <Card key={block.id}>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <MemberAvatar member={member} size={44} />
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{member.nickname}</p>
                        <p className='text-[11px] text-[#9a9a9a]'>
                          {new Date(block.createdAt).toLocaleDateString('ja-JP')} にブロック
                        </p>
                      </div>
                    </div>
                    <form action={unblockMemberAction}>
                      <input type='hidden' name='blockedMemberId' value={member.id} />
                      <button type='submit' className='min-h-[44px] rounded-full border border-[#d8d6d1] px-4 text-xs font-semibold text-[#6b6b6b]'>
                        解除
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ConnectionShell>
  );
}
