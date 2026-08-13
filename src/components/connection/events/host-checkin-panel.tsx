import Image from 'next/image';
import Link from 'next/link';
import { Card, Chip } from '@/components/connection/ui';
import { HostCheckinCodeCard } from '@/components/connection/events/host-checkin-code-card';
import {
  hostCancelCheckinAction,
  hostManualCheckinAction,
  endEventAndRequestRevenueAction,
} from '@/lib/connection/event-operations/actions';
import type { EventCheckin } from '@/lib/connection/event-operations/types';
import type { ConnectionMember } from '@/lib/connection/types';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';

type Props = {
  eventId: string;
  hasCheckinCode: boolean;
  currentCheckinCode?: string | null;
  newCheckinCode?: string | null;
  regenerated?: boolean;
  regenError?: boolean;
  confirmedMembers: ConnectionMember[];
  checkins: EventCheckin[];
  endedAt?: string | null;
};

export function HostCheckinPanel({
  eventId,
  hasCheckinCode,
  currentCheckinCode,
  newCheckinCode,
  confirmedMembers,
  checkins,
  endedAt,
}: Props) {
  const activeCheckins = checkins.filter((c) => c.status === 'checked_in');
  const checkedInIds = new Set(activeCheckins.map((c) => c.memberId));
  const initialCode =
    (newCheckinCode && /^\d{4}$/.test(newCheckinCode) ? newCheckinCode : null) ??
    (currentCheckinCode && /^\d{4}$/.test(currentCheckinCode) ? currentCheckinCode : null);

  return (
    <section className='space-y-4'>
      <h2 className='text-sm font-semibold text-[#1a1a1a]'>チェックイン管理</h2>

      <HostCheckinCodeCard
        eventId={eventId}
        hasCheckinCode={hasCheckinCode}
        initialCode={initialCode}
      />

      <Card>
        <p className='mb-3 text-sm font-semibold'>手動チェックイン</p>
        {confirmedMembers.length === 0 ? (
          <p className='text-sm text-[#9a9a9a]'>参加確定者がいません。</p>
        ) : (
          <div className='space-y-3'>
            {confirmedMembers.map((m) => {
              const checkedIn = checkedInIds.has(m.id);
              return (
                <div key={m.id} className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <Image
                      src={memberMainPhotoUrl(m)}
                      alt={m.nickname}
                      width={36}
                      height={36}
                      className='h-9 w-9 rounded-full object-cover object-top'
                    />
                    <div>
                      <p className='text-sm font-medium'>{m.nickname}</p>
                      {checkedIn ? <Chip tone='accent'>チェックイン済</Chip> : <Chip tone='muted'>未チェックイン</Chip>}
                    </div>
                  </div>
                  {checkedIn ? (
                    <form action={hostCancelCheckinAction}>
                      <input type='hidden' name='eventId' value={eventId} />
                      <input type='hidden' name='memberId' value={m.id} />
                      <button type='submit' className='rounded-full border border-[#d8d6d1] px-3 py-1.5 text-xs text-[#6b6b6b]'>
                        取消
                      </button>
                    </form>
                  ) : (
                    <form action={hostManualCheckinAction}>
                      <input type='hidden' name='eventId' value={eventId} />
                      <input type='hidden' name='memberId' value={m.id} />
                      <button type='submit' className='rounded-full bg-[#1f5d4f] px-3 py-1.5 text-xs font-medium text-white'>
                        手動チェックイン
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {checkins.length > 0 ? (
        <Card>
          <p className='mb-3 text-sm font-semibold'>チェックイン履歴（監査ログ）</p>
          <ul className='space-y-2 text-xs text-[#6b6b6b]'>
            {checkins.map((c) => (
              <li key={c.id} className='flex justify-between gap-2 border-b border-[#f1efe9] pb-2 last:border-0'>
                <span>
                  {c.memberId.slice(0, 8)}… · {c.method === 'manual' ? '手動' : 'コード'}
                  {c.status === 'cancelled' ? ' · 取消済' : ''}
                </span>
                <span>{new Date(c.checkedInAt).toLocaleString('ja-JP')}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!endedAt ? (
        <form action={endEventAndRequestRevenueAction}>
          <input type='hidden' name='eventId' value={eventId} />
          <button
            type='submit'
            className='h-11 w-full rounded-full border border-[#b8956a] bg-[#fbf8f3] text-sm font-semibold text-[#8a6d45]'
          >
            イベントを終了して売上報告を依頼する
          </button>
        </form>
      ) : (
        <Link
          href={`/events/${eventId}/revenue-report`}
          className='inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
        >
          売上を報告する
        </Link>
      )}
    </section>
  );
}
