import { AdminCard, AdminPageHeader, Badge } from '@/components/admin/ui';
import { getAdminUser, listEventReviews } from '@/lib/connection/admin-data';
import { getEvent } from '@/lib/connection/data';
import type { EventReview } from '@/lib/connection/admin-types';

function name(id: string) {
  return getAdminUser(id)?.nickname ?? id;
}
function eventTitle(id: string) {
  return getEvent(id)?.title ?? id;
}
function stars(n: number) {
  return '★'.repeat(Math.round(n)) + '☆'.repeat(Math.max(0, 5 - Math.round(n)));
}

export default function AdminReviewsPage() {
  const reviews = listEventReviews().sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention));
  const flagged = reviews.filter((r) => r.needsAttention).length;

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='REVIEWS'
        title='参加後レビュー'
        description='イベント後アンケートを確認します。再会率・Host評価・参加態度・次回のConnection設計に活用します。'
      />

      {flagged > 0 ? (
        <p className='rounded-2xl border border-[#e7b9b9] bg-[#fbeeee] px-4 py-3 text-xs text-[#a23b3b]'>
          要確認フラグのあるレビューが {flagged} 件あります。優先的にご確認ください。
        </p>
      ) : null}

      <div className='space-y-4'>
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className='text-[10px] text-[#9a9a9a]'>{label}</p>
      <p className='text-xs font-medium text-[#1a1a1a]'>{children}</p>
    </div>
  );
}

function ReviewCard({ review: r }: { review: EventReview }) {
  const meetAgain = r.wantToMeetAgainIds.map(name).join('、') || 'なし';

  return (
    <AdminCard className={r.needsAttention ? 'border-[#e7b9b9] ring-1 ring-[#f3d4d4]' : ''}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-semibold text-[#1a1a1a]'>{eventTitle(r.eventId)}</p>
          <p className='text-xs text-[#6b6b6b]'>回答者：{name(r.respondentId)}</p>
        </div>
        {r.needsAttention ? <Badge tone='red'>要確認</Badge> : <Badge tone='green'>問題なし</Badge>}
      </div>

      <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Item label='満足度'>
          <span className='text-[#1f5d4f]'>{stars(r.satisfaction)}</span>
        </Item>
        <Item label='また参加したいか'>{r.wantAgain ? 'はい' : 'いいえ'}</Item>
        <Item label='新しい視点'>{r.newPerspective ? '得られた' : '得られなかった'}</Item>
        <Item label='主催者の印象'>
          <span className='text-[#1f5d4f]'>{stars(r.hostImpression)}</span>
        </Item>
      </div>

      <div className='mt-3'>
        <p className='text-[10px] text-[#9a9a9a]'>また会いたい人</p>
        <p className='text-xs font-medium text-[#1a1a1a]'>{meetAgain}</p>
      </div>

      <div className='mt-3 rounded-xl bg-[#faf9f5] p-3'>
        <p className='text-[10px] text-[#9a9a9a]'>自由記述</p>
        <p className='mt-1 text-sm leading-7 text-[#4a4a4a]'>{r.freeText}</p>
      </div>
    </AdminCard>
  );
}
