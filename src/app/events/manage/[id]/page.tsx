import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { HostBadgeList } from '@/components/connection/host-badge';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { Card, Chip } from '@/components/connection/ui';
import { approveApplicationAction, rejectApplicationAction } from '@/lib/connection/actions';
import { INTEREST_TAG_LABEL, VALUE_TAG_LABEL, formatEventDate } from '@/lib/connection/data';
import { getEvent, getMember, listApplications } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManageEventPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(id);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const isHost = !!viewerMemberId && event.hostId === viewerMemberId;
  const hostMember = viewerMemberId ? await getMember(viewerMemberId) : null;

  if (!isHost) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='space-y-5'>
          <Link href={`/events/${event.id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント詳細へ
          </Link>
          <Card className='text-center'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>主催者のみが管理できます</p>
            <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
              この画面は、このイベントを主催している方だけがご覧いただけます。
            </p>
          </Card>
        </div>
      </ConnectionShell>
    );
  }

  const applications = await listApplications(event.id);
  const pending = applications.filter((a) => a.status === 'pending');
  const confirmed = applications.filter((a) => a.status === 'confirmed');

  const memberIds = [...new Set(applications.map((a) => a.memberId))];
  const memberList = await Promise.all(memberIds.map((mid) => getMember(mid)));
  const memberMap = new Map(memberList.filter(Boolean).map((m) => [m!.id, m!]));
  const justApproved = typeof sp.approved === 'string' ? sp.approved : '';
  const justRejected = typeof sp.rejected === 'string' ? sp.rejected : '';

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div className='space-y-3'>
          <Link href={`/events/${event.id}`} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント詳細へ
          </Link>
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>HOST MANAGEMENT</p>
            <h1 className='mt-2 text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
            <p className='mt-1 text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
          </div>
          <HostBadgeList badges={hostMember?.hostBadges} />
        </div>

        {justApproved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            参加者を承認しました。参加予定者一覧に追加されました。
          </p>
        ) : null}
        {justRejected ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs text-[#6b6b6b]'>
            申請を却下しました。
          </p>
        ) : null}

        <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          HANAKAIは「人を集める」場ではありません。参加理由を読み、あなたが心地よいと感じるConnectionを選んでください。
        </p>

        {/* 申請者 */}
        <section className='space-y-4'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>申請者 {pending.length}名</h2>
          {pending.length === 0 ? (
            <Card>
              <p className='text-sm text-[#9a9a9a]'>現在、承認待ちの申請はありません。</p>
            </Card>
          ) : (
            pending.map((app) => {
              const m = memberMap.get(app.memberId);
              if (!m) return null;
              const valueTags = m.values.valueTags ?? [];
              return (
                <Card key={app.id}>
                  <div className='flex items-start gap-3'>
                    <Image
                      src={m.avatarUrl}
                      alt={m.nickname}
                      width={48}
                      height={48}
                      className='h-12 w-12 shrink-0 rounded-full object-cover'
                    />
                    <div className='min-w-0 flex-1 space-y-1'>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-semibold text-[#1a1a1a]'>{m.nickname}</p>
                        <span className='text-xs text-[#9a9a9a]'>{m.age}歳 · {m.area}</span>
                      </div>
                      <TrustBadgeList member={m} />
                    </div>
                  </div>

                  {m.interestTags.length > 0 ? (
                    <div className='mt-3'>
                      <p className='mb-1.5 text-[11px] text-[#9a9a9a]'>興味タグ</p>
                      <div className='flex flex-wrap gap-1.5'>
                        {m.interestTags.map((t) => (
                          <Chip key={t} tone='neutral'>{INTEREST_TAG_LABEL[t]}</Chip>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {valueTags.length > 0 ? (
                    <div className='mt-3'>
                      <p className='mb-1.5 text-[11px] text-[#9a9a9a]'>価値観タグ</p>
                      <div className='flex flex-wrap gap-1.5'>
                        {valueTags.map((t) => (
                          <Chip key={t} tone='muted'>{VALUE_TAG_LABEL[t]}</Chip>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className='mt-3 rounded-2xl bg-[#faf9f6] p-3.5'>
                    <p className='mb-1 text-[11px] text-[#9a9a9a]'>参加理由</p>
                    <p className='text-sm leading-7 text-[#4a4a4a]'>
                      {app.reason ?? '（参加理由は入力されていません）'}
                    </p>
                  </div>

                  <div className='mt-4 flex gap-3'>
                    <form action={rejectApplicationAction} className='flex-1'>
                      <input type='hidden' name='eventId' value={event.id} />
                      <input type='hidden' name='memberId' value={m.id} />
                      <button
                        type='submit'
                        className='h-11 w-full rounded-full border border-[#d8d6d1] bg-white text-sm font-semibold text-[#6b6b6b] transition active:scale-[0.98]'
                      >
                        却下
                      </button>
                    </form>
                    <form action={approveApplicationAction} className='flex-1'>
                      <input type='hidden' name='eventId' value={event.id} />
                      <input type='hidden' name='memberId' value={m.id} />
                      <button
                        type='submit'
                        className='h-11 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.98]'
                      >
                        承認
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })
          )}
        </section>

        {/* 参加予定者 */}
        <section className='space-y-4'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>
            参加予定者 {confirmed.length}名 <span className='font-normal text-[#9a9a9a]'>/ 定員{event.capacity}名</span>
          </h2>
          <Card>
            {confirmed.length === 0 ? (
              <p className='text-sm text-[#9a9a9a]'>まだ参加者は確定していません。</p>
            ) : (
              <div className='space-y-3'>
                {confirmed.map((app) => {
                  const m = memberMap.get(app.memberId);
                  if (!m) return null;
                  return (
                    <div key={app.id} className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-3'>
                        <Image
                          src={m.avatarUrl}
                          alt={m.nickname}
                          width={40}
                          height={40}
                          className='h-10 w-10 rounded-full object-cover'
                        />
                        <div>
                          <p className='text-sm font-medium text-[#1a1a1a]'>{m.nickname}</p>
                          <p className='text-[11px] text-[#6b6b6b]'>{m.age}歳 · {m.area}</p>
                        </div>
                      </div>
                      <Chip tone='accent'>承認済み</Chip>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>
      </div>
    </ConnectionShell>
  );
}
