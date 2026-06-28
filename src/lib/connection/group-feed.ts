import type { GroupFeedItem, GroupPhoto, GroupPost } from '@/lib/connection/types';

export function buildGroupFeed(posts: GroupPost[], photos: GroupPhoto[]): GroupFeedItem[] {
  const photosByPost = new Map<string, GroupPhoto[]>();
  const standalone: GroupPhoto[] = [];

  for (const photo of photos) {
    if (photo.postId) {
      const list = photosByPost.get(photo.postId) ?? [];
      list.push(photo);
      photosByPost.set(photo.postId, list);
    } else {
      standalone.push(photo);
    }
  }

  const items: GroupFeedItem[] = posts.map((post) => ({
    type: 'post',
    post,
    photos: photosByPost.get(post.id) ?? [],
  }));

  for (const photo of standalone) {
    items.push({
      type: 'photos',
      photos: [photo],
      memberId: photo.memberId,
      createdAt: photo.createdAt,
    });
  }

  return items.sort((a, b) => {
    const ta = a.type === 'post' ? a.post.createdAt : a.createdAt;
    const tb = b.type === 'post' ? b.post.createdAt : b.createdAt;
    return tb.localeCompare(ta);
  });
}

export const GROUP_PHOTO_STATUS_LABEL: Record<GroupPhoto['usageStatus'], string> = {
  private: '参加者限定',
  requested: '利用許可申請中',
  approved: '利用許可済み',
  rejected: '利用不可',
  reported: '通報あり',
};

export const GROUP_USAGE_SCOPE_LABEL = {
  site: 'HANAKAIサイト内',
  event_page: '次回イベントページ',
  sns: 'SNS投稿',
  ad: '広告',
  print: '印刷物',
} as const;

export function formatGroupDate(iso: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
