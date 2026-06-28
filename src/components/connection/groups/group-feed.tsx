import Image from 'next/image';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { Chip } from '@/components/connection/ui';
import {
  hideGroupPhotoAction,
  hideGroupPostAction,
  reportGroupPhotoAction,
  reportGroupPostAction,
  requestPhotoUsageAction,
} from '@/lib/connection/group-actions';
import {
  GROUP_PHOTO_STATUS_LABEL,
  buildGroupFeed,
  formatGroupDate,
} from '@/lib/connection/group-feed';
import type { ConnectionMember, GroupPhoto } from '@/lib/connection/types';

type GroupFeedProps = {
  eventId: string;
  posts: import('@/lib/connection/types').GroupPost[];
  photos: GroupPhoto[];
  memberMap: Map<string, ConnectionMember>;
  viewerMemberId: string;
  isAdmin: boolean;
};

function PhotoGrid({
  eventId,
  photos,
  isAdmin,
}: {
  eventId: string;
  photos: GroupPhoto[];
  isAdmin: boolean;
}) {
  if (photos.length === 0) return null;
  return (
    <div className={`mt-3 grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {photos.map((photo) => (
        <div key={photo.id} className='space-y-2'>
          <div className='relative aspect-[4/3] overflow-hidden rounded-xl border border-[#ebe9e4] bg-[#f5f4f2]'>
            <Image src={photo.url} alt='' fill sizes='(max-width:480px) 50vw, 240px' className='object-cover' />
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Chip tone='muted'>{GROUP_PHOTO_STATUS_LABEL[photo.usageStatus]}</Chip>
            <form action={reportGroupPhotoAction}>
              <input type='hidden' name='eventId' value={eventId} />
              <input type='hidden' name='photoId' value={photo.id} />
              <button type='submit' className='text-[11px] text-[#9a9a9a] underline-offset-2 hover:underline'>
                通報
              </button>
            </form>
            {isAdmin ? (
              <>
                {photo.usageStatus === 'private' ? (
                  <form action={requestPhotoUsageAction}>
                    <input type='hidden' name='eventId' value={eventId} />
                    <input type='hidden' name='photoId' value={photo.id} />
                    <button type='submit' className='text-[11px] font-medium text-[#1f5d4f] underline-offset-2 hover:underline'>
                      利用許可をリクエスト
                    </button>
                  </form>
                ) : null}
                <form action={hideGroupPhotoAction}>
                  <input type='hidden' name='eventId' value={eventId} />
                  <input type='hidden' name='photoId' value={photo.id} />
                  <button type='submit' className='text-[11px] text-rose-600 underline-offset-2 hover:underline'>
                    非表示
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupFeedList({ eventId, posts, photos, memberMap, viewerMemberId, isAdmin }: GroupFeedProps) {
  const feed = buildGroupFeed(posts, photos);

  if (feed.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-[#e8e4dc] bg-[#faf9f6] px-5 py-10 text-center'>
        <p className='text-sm text-[#6b6b6b]'>まだ投稿がありません</p>
        <p className='mt-1 text-xs text-[#9a9a9a]'>感想や写真で、イベントの余韻を共有してみましょう。</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {feed.map((item) => {
        if (item.type === 'post') {
          const member = memberMap.get(item.post.memberId);
          const isSelf = item.post.memberId === viewerMemberId;
          return (
            <article key={item.post.id} className='rounded-2xl border border-[#ebe9e4] bg-white p-4'>
              <div className='flex items-start gap-3'>
                {member ? <MemberAvatar member={member} size={36} /> : null}
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-semibold text-[#1a1a1a]'>{member?.nickname ?? '参加者'}</p>
                    {isSelf ? <Chip tone='muted'>あなた</Chip> : null}
                    <time className='text-[11px] text-[#9a9a9a]'>{formatGroupDate(item.post.createdAt)}</time>
                  </div>
                  {item.post.body ? (
                    <p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4a4a4a]'>{item.post.body}</p>
                  ) : null}
                  <PhotoGrid eventId={eventId} photos={item.photos} isAdmin={isAdmin} />
                  <div className='mt-3 flex gap-3'>
                    <form action={reportGroupPostAction}>
                      <input type='hidden' name='eventId' value={eventId} />
                      <input type='hidden' name='postId' value={item.post.id} />
                      <button type='submit' className='text-[11px] text-[#9a9a9a] underline-offset-2 hover:underline'>
                        通報
                      </button>
                    </form>
                    {isAdmin ? (
                      <form action={hideGroupPostAction}>
                        <input type='hidden' name='eventId' value={eventId} />
                        <input type='hidden' name='postId' value={item.post.id} />
                        <button type='submit' className='text-[11px] text-rose-600 underline-offset-2 hover:underline'>
                          非表示
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        }

        const member = memberMap.get(item.memberId);
        return (
          <article key={item.photos[0]?.id ?? item.createdAt} className='rounded-2xl border border-[#ebe9e4] bg-white p-4'>
            <div className='flex items-center gap-2'>
              {member ? <MemberAvatar member={member} size={32} /> : null}
              <p className='text-sm font-semibold text-[#1a1a1a]'>{member?.nickname ?? '参加者'}</p>
              <time className='text-[11px] text-[#9a9a9a]'>{formatGroupDate(item.createdAt)}</time>
            </div>
            <PhotoGrid eventId={eventId} photos={item.photos} isAdmin={isAdmin} />
          </article>
        );
      })}
    </div>
  );
}
