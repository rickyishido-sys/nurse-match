import Link from 'next/link';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { HostBadgeList } from '@/components/connection/host-badge';
import { ReportButton } from '@/components/connection/report-button';
import { Card } from '@/components/connection/ui';
import type { BloomProfile } from '@/lib/connection/bloom-profile-types';
import type { ParticipantPreviewCard, TimelineStep } from '@/lib/connection/event-detail-ux';
import type { ConnectionMember } from '@/lib/connection/types';

const GOLD = '#b8956a';

export function EventSectionShell({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-4'>
      {kicker ? (
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          {kicker}
        </p>
      ) : null}
      <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>{title}</h2>
      {children}
    </section>
  );
}

export function EventDayTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <Card className='!p-0 overflow-hidden'>
      <div className='space-y-0'>
        {steps.map((step, i) => (
          <div key={step.label} className='relative flex gap-4 px-5 py-4'>
            {i < steps.length - 1 ? (
              <span className='absolute bottom-0 left-[2.15rem] top-12 w-px bg-[#e7e2d8]' aria-hidden />
            ) : null}
            <div className='flex w-14 shrink-0 flex-col items-center'>
              <span
                className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#b8956a] bg-[#faf7f2] text-[10px] font-bold text-[#1f5d4f]'
                aria-hidden
              >
                {i + 1}
              </span>
            </div>
            <div className='min-w-0 flex-1 border-b border-[#f1efe9] pb-4 last:border-b-0'>
              <p className='text-sm font-semibold text-[#1f5d4f]'>{step.time}</p>
              <p className='mt-0.5 text-sm font-medium text-[#1a1a1a]'>{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function EventRecommendedCards({ items }: { items: string[] }) {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {items.map((item) => (
        <div
          key={item}
          className='flex items-center gap-3 rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(26,26,26,0.03)]'
        >
          <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3f7f5] text-sm font-bold text-[#1f5d4f]'>
            ✓
          </span>
          <p className='text-sm font-medium text-[#1a1a1a]'>{item}</p>
        </div>
      ))}
    </div>
  );
}

export function EventParticipantPreview({
  cards,
  isPlaceholder,
}: {
  cards: ParticipantPreviewCard[];
  isPlaceholder: boolean;
}) {
  return (
    <div>
      {isPlaceholder ? (
        <p className='mb-3 text-xs leading-6 text-[#9a9a9a]'>
          ※ 参加予定者のイメージ（個人情報は表示しません）
        </p>
      ) : null}
      <div className='flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {cards.map((card) => (
          <div
            key={card.id}
            className='flex w-[148px] shrink-0 flex-col items-center rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-3 py-4 text-center'
          >
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3ef] text-lg text-[#1f5d4f]' aria-hidden>
              ✿
            </span>
            <p className='mt-3 text-sm font-semibold text-[#1a1a1a]'>{card.ageBand}</p>
            <div className='mt-2 flex flex-wrap justify-center gap-1'>
              {card.traits.map((t) => (
                <span
                  key={t}
                  className='rounded-full border border-[#e7e2d8] bg-white px-2 py-0.5 text-[10px] text-[#6b6b6b]'
                >
                  {t}
                </span>
              ))}
            </div>
            <p className='mt-2 text-[10px] font-medium text-[#1f5d4f]'>{card.tag}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventHostSection({
  host,
  hostName,
  bloomProfile,
  eventId,
  viewerMemberId,
}: {
  host: ConnectionMember | null;
  hostName: string;
  bloomProfile: BloomProfile | null;
  eventId: string;
  viewerMemberId: string | null;
}) {
  const vision =
    bloomProfile?.bloomSummary?.trim() ||
    host?.bio?.trim() ||
    '心地よい場で、知らない人同士が自然につながる時間をつくりたいと思っています。';

  return (
    <Card className='overflow-hidden !p-0'>
      <div className='bg-gradient-to-br from-[#f3f7f5] to-[#faf7f2] px-6 py-6 sm:px-8'>
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          HOST
        </p>
        <p className='mt-4 font-serif text-lg font-semibold leading-8 text-[#1a1a1a] sm:text-xl'>
          {vision}
        </p>
        <p className='mt-2 text-xs text-[#6b6b6b]'>どんな場を作りたいか</p>
      </div>
      <div className='flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-start sm:gap-5'>
        {host ? (
          <MemberAvatar member={host} size={80} className='shrink-0' />
        ) : (
          <span className='flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#f0eeea] text-2xl' aria-hidden>
            ✿
          </span>
        )}
        <div className='min-w-0 flex-1 space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            {host ? (
              <Link href={`/profile/${host.id}`} className='text-base font-semibold text-[#1a1a1a] hover:underline'>
                {hostName}
              </Link>
            ) : (
              <p className='text-base font-semibold text-[#1a1a1a]'>{hostName}</p>
            )}
            {host && viewerMemberId && host.id !== viewerMemberId ? (
              <ReportButton
                target={{
                  targetType: 'member',
                  targetMemberId: host.id,
                  label: `${host.nickname}（主催者）`,
                }}
                canReport={!!viewerMemberId}
                loginNext={`/events/${eventId}`}
              />
            ) : null}
          </div>
          {host ? <p className='text-xs text-[#6b6b6b]'>{host.occupation} · {host.area}</p> : null}
          {host ? <TrustBadgeList member={host} /> : null}
          {host ? <HostBadgeList badges={host.hostBadges} /> : null}
          {bloomProfile?.bloomSummaryTitle || bloomProfile?.bloomSummary ? (
            <div className='rounded-xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3'>
              <p className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>Bloom Summary</p>
              {bloomProfile.bloomSummaryTitle ? (
                <p className='mt-1 text-sm font-semibold text-[#1f5d4f]'>{bloomProfile.bloomSummaryTitle}</p>
              ) : null}
              {bloomProfile.bloomSummary ? (
                <p className='mt-1 text-sm leading-7 text-[#4a4a4a]'>{bloomProfile.bloomSummary}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function EventBloomAfterCard() {
  return (
    <Card className='border-[#e8dfd0] bg-gradient-to-br from-[#fbf8f3] to-[#f3f7f5]'>
      <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
        AFTER THE EVENT
      </p>
      <h3 className='mt-3 text-base font-semibold text-[#1a1a1a]'>
        イベント終了後、Bloom Profileに思い出が残ります
      </h3>
      <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
        参加したConnectionは、あなたのプロフィールに記録として育っていきます。
      </p>
      <div className='mt-5 grid gap-3 sm:grid-cols-3'>
        {[
          { title: 'Bloom Timeline', body: '参加や更新の履歴' },
          { title: 'Bloom Memory', body: '印象に残ったこと' },
          { title: '最近のあなた', body: 'つながりの振り返り' },
        ].map((item) => (
          <div key={item.title} className='rounded-xl border border-[#ebe9e4] bg-white px-3 py-3 text-center'>
            <p className='text-xs font-semibold text-[#1f5d4f]'>{item.title}</p>
            <p className='mt-1 text-[11px] text-[#6b6b6b]'>{item.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function EventBloomIntroCard() {
  return (
    <Card>
      <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
        BLOOM PROFILE
      </p>
      <h3 className='mt-3 text-base font-semibold text-[#1a1a1a]'>
        参加後は、あなたのBloom Profileに新しいConnectionの記録が追加されます
      </h3>
      <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
        一度きりの出会いで終わらせません。体験を重ねるほど、あなたらしさが少しずつ育っていきます。
      </p>
    </Card>
  );
}

export function EventSafetyStrip() {
  const items = [
    { icon: '🪪', label: '本人確認' },
    { icon: '🚩', label: '通報機能' },
    { icon: '🛡️', label: '運営サポート' },
    { icon: '👥', label: '少人数開催' },
  ] as const;

  return (
    <Card className='bg-[#fafaf8]'>
      <h3 className='text-base font-semibold text-[#1a1a1a]'>安心して参加できます</h3>
      <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {items.map((item) => (
          <div
            key={item.label}
            className='flex flex-col items-center rounded-xl border border-[#ebe9e4] bg-white px-3 py-4 text-center'
          >
            <span className='text-2xl' aria-hidden>
              {item.icon}
            </span>
            <p className='mt-2 text-xs font-semibold text-[#1a1a1a]'>{item.label}</p>
          </div>
        ))}
      </div>
      <p className='mt-4 text-center text-xs text-[#6b6b6b]'>
        困ったときは運営がサポートします。
        <Link href='/community-guidelines' className='ml-1 font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
          ガイドライン
        </Link>
      </p>
    </Card>
  );
}
