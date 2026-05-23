'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/badges';
import { swipeAction } from '@/lib/actions';
import type { ActivityIncomingCard, ActivityMatchCard, ActivityOutgoingCard } from '@/lib/data';
import { ProfileDetailModal } from '@/components/profile-detail-modal';

type ActivityTabsProps = {
  userId: string;
  incoming: ActivityIncomingCard[];
  outgoing: ActivityOutgoingCard[];
  matches: ActivityMatchCard[];
};

type TabKey = 'incoming' | 'outgoing' | 'matches';

function statusLabel(status: ActivityOutgoingCard['status']) {
  if (status === 'matched') return 'マッチ成立';
  if (status === 'checking') return '確認中';
  return '相手待ち';
}

export function ActivityTabs({ userId, incoming, outgoing, matches }: ActivityTabsProps) {
  const [tab, setTab] = useState<TabKey>('incoming');
  const [isPending, startTransition] = useTransition();
  const [matched, setMatched] = useState<ActivityMatchCard | null>(null);
  const [selected, setSelected] = useState<{
    user: ActivityIncomingCard['user'];
    maleProfile: ActivityIncomingCard['maleProfile'];
    femaleProfile: ActivityIncomingCard['femaleProfile'];
    profileImages: ActivityIncomingCard['profileImages'];
    likeTargetId: string | null;
  } | null>(null);
  const router = useRouter();

  const activeList = useMemo(() => (tab === 'incoming' ? incoming : tab === 'outgoing' ? outgoing : matches), [tab, incoming, outgoing, matches]);

  function returnInterest(target: ActivityIncomingCard) {
    startTransition(async () => {
      const form = new FormData();
      form.set('fromUserId', userId);
      form.set('toUserId', target.user.id);
      form.set('action', 'like');
      const result = await swipeAction(form);
      if (result?.matched && result.matchId) {
        setMatched({
          matchId: result.matchId,
          matchedAt: new Date().toISOString(),
          user: target.user,
          maleProfile: target.maleProfile,
          femaleProfile: target.femaleProfile,
          profileImages: target.profileImages,
        });
      }
      router.refresh();
    });
  }

  return (
    <section className='space-y-4'>
      <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
        <h1 className='text-lg font-bold text-slate-900'>興味あり管理</h1>
        <p className='mt-1 text-sm text-slate-600'>誰があなたに興味を持っているかを中心に、温度感を整理できます。</p>
      </article>

      <div className='grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm'>
        <button onClick={() => setTab('incoming')} className={`h-10 rounded-xl text-sm font-semibold ${tab === 'incoming' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
          相手から
        </button>
        <button onClick={() => setTab('outgoing')} className={`h-10 rounded-xl text-sm font-semibold ${tab === 'outgoing' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
          自分から
        </button>
        <button onClick={() => setTab('matches')} className={`h-10 rounded-xl text-sm font-semibold ${tab === 'matches' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
          マッチ
        </button>
      </div>

      {tab === 'incoming' ? (
        <article className='rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-xs leading-6 text-slate-700'>
          あなたに興味を持っているメンバーです。お互いに興味ありになるとマッチが成立します。
        </article>
      ) : null}

      {activeList.length === 0 ? (
        <article className='rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-600 shadow-sm'>
          {tab === 'incoming'
            ? 'まだ興味ありは届いていません'
            : tab === 'outgoing'
              ? '気になる相手に興味ありを送ってみましょう'
              : 'マッチするとここに表示されます'}
        </article>
      ) : null}

      {tab === 'incoming'
        ? incoming.map((row) => (
            <article key={row.user.id} className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
              <div className='flex items-start gap-3'>
                <Image src={row.user.profileImageUrl} alt={row.user.nickname} width={72} height={72} className='h-[72px] w-[72px] rounded-2xl object-cover' />
                <div className='flex-1'>
                  <p className='text-base font-semibold text-slate-900'>{row.user.nickname}・{row.user.age}</p>
                  <p className='text-xs text-slate-500'>{row.user.location}</p>
                  <p className='mt-1 line-clamp-1 text-xs text-slate-600'>{row.user.bio}</p>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    <Badge tone='green'>本人確認済み</Badge>
                    {row.femaleProfile?.nurseVerificationStatus === 'approved' ? <Badge tone='pink'>看護師確認済み</Badge> : null}
                    {row.maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>男性審査通過</Badge> : null}
                  </div>
                  <p className='mt-1 text-[11px] text-slate-400'>{new Date(row.sentAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  disabled={isPending}
                  onClick={() => returnInterest(row)}
                  className='h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50'
                >
                  ♡ 興味ありを返す
                </button>
                <button
                  onClick={() =>
                    setSelected({
                      user: row.user,
                      maleProfile: row.maleProfile,
                      femaleProfile: row.femaleProfile,
                      profileImages: row.profileImages,
                      likeTargetId: row.user.id,
                    })
                  }
                  className='h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700'
                >
                  詳細を見る
                </button>
              </div>
            </article>
          ))
        : null}

      {tab === 'outgoing'
        ? outgoing.map((row) => (
            <article
              key={row.user.id}
              className={`space-y-2 rounded-3xl border p-4 shadow-sm ${
                row.status === 'matched' ? 'border-pink-200 bg-pink-50/70' : 'border-slate-100 bg-white'
              }`}
            >
              <div className='flex items-center gap-3'>
                <Image src={row.user.profileImageUrl} alt={row.user.nickname} width={64} height={64} className='h-16 w-16 rounded-2xl object-cover' />
                <div className='flex-1'>
                  <p className='font-semibold text-slate-900'>{row.user.nickname}・{row.user.age}</p>
                  <p className='text-xs text-slate-500'>{row.user.location}</p>
                  <p className='text-[11px] text-slate-400'>{new Date(row.sentAt).toLocaleString('ja-JP')}</p>
                </div>
                <Badge tone={row.status === 'matched' ? 'pink' : 'gray'}>{statusLabel(row.status)}</Badge>
              </div>
              <button
                onClick={() =>
                  setSelected({
                    user: row.user,
                    maleProfile: row.maleProfile,
                    femaleProfile: row.femaleProfile,
                    profileImages: row.profileImages,
                    likeTargetId: null,
                  })
                }
                className='h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700'
              >
                詳細を見る
              </button>
            </article>
          ))
        : null}

      {tab === 'matches'
        ? matches.map((row) => (
            <article key={row.matchId} className='rounded-3xl border border-pink-100 bg-white p-4 shadow-[0_20px_45px_-32px_rgba(236,72,153,0.45)]'>
              <div className='flex items-center gap-3'>
                <Image src={row.user.profileImageUrl} alt={row.user.nickname} width={70} height={70} className='h-[70px] w-[70px] rounded-2xl object-cover' />
                <div className='flex-1'>
                  <p className='text-base font-semibold text-slate-900'>{row.user.nickname}・{row.user.age}</p>
                  <p className='text-xs text-slate-500'>{row.user.location}</p>
                  <p className='text-[11px] text-slate-400'>マッチ日時: {new Date(row.matchedAt).toLocaleString('ja-JP')}</p>
                </div>
                <Badge tone='pink'>MATCH</Badge>
              </div>
              <Link href={`/chat/${row.matchId}`} className='mt-3 flex h-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white'>
                メッセージを開く
              </Link>
              <button
                onClick={() =>
                  setSelected({
                    user: row.user,
                    maleProfile: row.maleProfile,
                    femaleProfile: row.femaleProfile,
                    profileImages: row.profileImages,
                    likeTargetId: null,
                  })
                }
                className='mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700'
              >
                詳細を見る
              </button>
            </article>
          ))
        : null}

      {matched ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4'>
          <div className='w-full max-w-[340px] rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-2xl'>
            <p className='text-5xl text-pink-500'>♡</p>
            <p className='mt-2 text-xl font-bold text-slate-900'>マッチしました</p>
            <p className='text-xs text-slate-500'>お互いの温度感がつながりました</p>
            <div className='mt-4 grid grid-cols-2 gap-2'>
              <button onClick={() => setMatched(null)} className='h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600'>
                あとで
              </button>
              <Link href={`/chat/${matched.matchId}`} className='flex h-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white'>
                メッセージを送る
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <ProfileDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        user={selected?.user ?? null}
        maleProfile={selected?.maleProfile ?? null}
        femaleProfile={selected?.femaleProfile ?? null}
        profileImages={selected?.profileImages ?? []}
        onLike={
          selected?.likeTargetId
            ? async () => {
                const targetId = selected.likeTargetId;
                if (!targetId) return;
                const form = new FormData();
                form.set('fromUserId', userId);
                form.set('toUserId', targetId);
                form.set('action', 'like');
                const result = await swipeAction(form);
                if (result?.matched && result.matchId && selected) {
                  setMatched({
                    matchId: result.matchId,
                    matchedAt: new Date().toISOString(),
                    user: selected.user,
                    maleProfile: selected.maleProfile,
                    femaleProfile: selected.femaleProfile,
                    profileImages: selected.profileImages,
                  });
                }
                setSelected(null);
                router.refresh();
              }
            : undefined
        }
        onSkip={() => setSelected(null)}
        likeDisabled={isPending}
        skipDisabled={isPending}
      />
    </section>
  );
}
