'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/badges';
import { maleInterestSignalAction, toggleFavoriteAction } from '@/lib/actions';
import { ProfileDetailModal } from '@/components/profile-detail-modal';
import type { AppUser, FemaleProfile, ProfileImageRecord } from '@/lib/types/domain';

type MaleCandidate = {
  user: AppUser;
  femaleProfile: FemaleProfile | null;
  profileImages: ProfileImageRecord[];
  signaledToday: boolean;
};

type MaleDailyCandidatesProps = {
  userId: string;
  candidates: MaleCandidate[];
  favoriteIds: string[];
};

function workplaceLabel(workplace: FemaleProfile['workplaceType'] | undefined) {
  if (!workplace) return '未設定';
  if (workplace === 'hospital') return '病院';
  if (workplace === 'clinic') return 'クリニック';
  if (workplace === 'beauty') return '美容';
  if (workplace === 'nightshift') return '夜勤専従';
  if (workplace === 'care_facility') return '介護施設';
  if (workplace === 'home_visit') return '訪問看護';
  return 'その他';
}

export function MaleDailyCandidates({ userId, candidates, favoriteIds }: MaleDailyCandidatesProps) {
  const [selected, setSelected] = useState<MaleCandidate | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const favoriteSet = new Set(favoriteIds);

  function signal(targetUserId: string, signalType: 'interested' | 'skipped') {
    startTransition(async () => {
      const form = new FormData();
      form.set('userId', userId);
      form.set('targetUserId', targetUserId);
      form.set('signalType', signalType);
      await maleInterestSignalAction(form);
      router.refresh();
    });
  }

  function toggleFavorite(targetUserId: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set('userId', userId);
      form.set('targetUserId', targetUserId);
      await toggleFavoriteAction(form);
      router.refresh();
    });
  }

  return (
    <>
      {candidates.length === 0 ? (
        <p className='text-sm text-slate-500'>候補は準備中です。</p>
      ) : (
        candidates.map((candidate) => (
          <article key={candidate.user.id} className='rounded-2xl border border-slate-100 bg-slate-50 p-3'>
            <div className='flex items-center gap-3'>
              <div className='relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200'>
                <Image src={candidate.user.profileImageUrl} alt={candidate.user.nickname} fill className='object-cover' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-semibold text-slate-900'>
                  {candidate.user.nickname}・{candidate.user.age}
                </p>
                <p className='text-xs text-slate-600'>{candidate.user.location}</p>
                <p className='text-xs text-slate-500'>勤務: {workplaceLabel(candidate.femaleProfile?.workplaceType)}</p>
                {candidate.signaledToday ? <Badge tone='amber'>送信済み</Badge> : null}
              </div>
            </div>
            <div className='mt-2 grid grid-cols-3 gap-2 text-xs'>
              <button
                type='button'
                disabled={candidate.signaledToday || isPending}
                onClick={() => signal(candidate.user.id, 'interested')}
                className='h-9 w-full rounded-xl bg-slate-900 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300'
              >
                興味あり
              </button>
              <button
                type='button'
                disabled={candidate.signaledToday || isPending}
                onClick={() => signal(candidate.user.id, 'skipped')}
                className='h-9 w-full rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                スキップ
              </button>
              <button
                type='button'
                disabled={isPending}
                onClick={() => toggleFavorite(candidate.user.id)}
                className='h-9 w-full rounded-xl border border-slate-200 bg-white font-semibold text-slate-700'
              >
                {favoriteSet.has(candidate.user.id) ? '保存済み' : 'お気に入り'}
              </button>
            </div>
            <button
              type='button'
              onClick={() => setSelected(candidate)}
              className='mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700'
            >
              詳細を見る
            </button>
          </article>
        ))
      )}

      <ProfileDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        user={selected?.user ?? null}
        maleProfile={null}
        femaleProfile={selected?.femaleProfile ?? null}
        profileImages={selected?.profileImages ?? []}
        viewerUserId={userId}
        onSkip={async () => {
          if (!selected) return;
          await signal(selected.user.id, 'skipped');
          setSelected(null);
        }}
        onLike={async () => {
          if (!selected) return;
          await signal(selected.user.id, 'interested');
          setSelected(null);
        }}
        likeDisabled={Boolean(selected?.signaledToday) || isPending}
        skipDisabled={Boolean(selected?.signaledToday) || isPending}
      />
    </>
  );
}
