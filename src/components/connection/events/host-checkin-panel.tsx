import Image from 'next/image';
import Link from 'next/link';
import { Card, Chip } from '@/components/connection/ui';
import {
  hostCancelCheckinAction,
  hostManualCheckinAction,
  endEventAndRequestRevenueAction,
  regenerateCheckinCodeAction,
} from '@/lib/connection/event-operations/actions';
import type { EventCheckin } from '@/lib/connection/event-operations/types';
import type { ConnectionMember } from '@/lib/connection/types';
import { memberMainPhotoUrl } from '@/lib/connection/member-photo';

type Props = {
  eventId: string;
  hasCheckinCode: boolean;
  /** Persisted host-readable code from DB */
  currentCheckinCode?: string | null;
  /** Just-regenerated code from redirect query (also shown) */
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
  regenerated = false,
  regenError = false,
  confirmedMembers,
  checkins,
  endedAt,
}: Props) {
  const activeCheckins = checkins.filter((c) => c.status === 'checked_in');
  const checkedInIds = new Set(activeCheckins.map((c) => c.memberId));
  const displayCode =
    (newCheckinCode && /^\d{4}$/.test(newCheckinCode) ? newCheckinCode : null) ??
    (currentCheckinCode && /^\d{4}$/.test(currentCheckinCode) ? currentCheckinCode : null);

  return (
    <section className='space-y-4'>
      <h2 className='text-sm font-semibold text-[#1a1a1a]'>チェックイン管理</h2>

      <Card className='space-y-3'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>現在のチェックインコード</p>
        <p className='text-xs leading-6 text-[#6b6b6b]'>
          イベント当日、参加者へ口頭で伝える4桁コードです。管理画面からいつでも確認・再発行できます。
        </p>

        {regenerated && displayCode ? (
          <p className='rounded-xl border border-[#cfe3da] bg-[#f3f7f5] px-3 py-2 text-xs font-medium text-[#1f5d4f]'>
            チェックインコードを再発行しました
          </p>
        ) : null}
        {regenError ? (
          <p className='rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700' role='alert'>
            再発行に失敗しました。時間をおいて再度お試しください。
          </p>
        ) : null}

        {displayCode ? (
          <p className='text-3xl font-bold tracking-[0.35em] text-[#1f5d4f]' aria-label={`チェックインコード ${displayCode}`}>
            {displayCode}
          </p>
        ) : hasCheckinCode ? (
          <p className='text-sm text-[#4a4a4a]'>
            以前のコードは表示できません。下のボタンから再発行すると、新しい4桁コードを確認できます。
          </p>
        ) : (
          <p className='text-sm text-[#4a4a4a]'>コード未設定です。再発行で新しいコードを作成できます。</p>
        )}

        <form action={regenerateCheckinCodeAction}>
          <input type='hidden' name='eventId' value={eventId} />
          <button
            type='submit'
            className='rounded-full border border-[#1f5d4f] px-4 py-2 text-xs font-semibold text-[#1f5d4f]'
          >
            チェックインコードを再発行
          </button>
        </form>
        <p className='text-[11px] leading-5 text-[#9a9a9a]'>
          再発行すると以前のコードは無効になり、新しいコードのみが使えます。
        </p>
        <Link
          href={`/events/${eventId}/checkin`}
          className='text-xs font-medium text-[#1f5d4f] underline-offset-2 hover:underline'
        >
          参加者用チェックイン画面 →
        </Link>
      </Card>

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
