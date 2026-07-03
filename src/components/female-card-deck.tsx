'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Badge } from '@/components/badges';
import { setFemaleSearchPreferenceAction, swipeAction } from '@/lib/actions';
import { ProfileDetailModal } from '@/components/profile-detail-modal';
import type { AppUser, FemaleProfile, MaleProfile, ProfileImageRecord } from '@/lib/types/domain';

type CandidateCard = {
  user: AppUser;
  maleProfile: MaleProfile | null;
  femaleProfile: FemaleProfile | null;
  profileImages: ProfileImageRecord[];
};

type FemaleFilters = {
  maritalFilter: 'single_only' | 'include_married' | 'include_partner';
  ageMin: number;
  ageMax: number;
  location: string;
  job: string;
  incomeMin: string;
  smoking: string;
  drinking: string;
  heightMin: number;
  verifiedOnly: boolean;
  maleReviewedOnly: boolean;
  incomeVerifiedOnly: boolean;
  facePhotoOnly: boolean;
};

type FemaleCardDeckProps = {
  userId: string;
  selfProfileImageUrl: string;
  cards: CandidateCard[];
  filters: FemaleFilters;
};

function getMainImage(card: CandidateCard) {
  return card.profileImages.find((img) => img.isMain)?.imageUrl ?? card.user.profileImageUrl;
}

function getJobLabel(card: CandidateCard) {
  if (card.user.gender === 'male') return card.maleProfile?.job || '未設定';
  const workplace = card.femaleProfile?.workplaceType;
  if (!workplace) return '未設定';
  return workplace === 'hospital'
    ? '病院'
    : workplace === 'clinic'
      ? 'クリニック'
      : workplace === 'beauty'
        ? '美容'
        : workplace === 'care_facility'
          ? '介護施設'
          : workplace === 'home_visit'
            ? '訪問看護'
            : 'その他';
}

export function FemaleCardDeck({ userId, selfProfileImageUrl, cards, filters }: FemaleCardDeckProps) {
  const [index, setIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cardMotion, setCardMotion] = useState<'idle' | 'like' | 'skip'>('idle');
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const [actionLocked, setActionLocked] = useState(false);
  const [matchedState, setMatchedState] = useState<{ matchId: string; target: CandidateCard } | null>(null);
  const [isPending, startTransition] = useTransition();
  const current = cards[index] ?? null;
  const remaining = Math.max(cards.length - index, 0);

  const cardTitle = useMemo(() => {
    if (!current) return '';
    return `${current.user.nickname} ${current.user.age}`;
  }, [current]);

  function submitSwipe(action: 'like' | 'skip') {
    if (!current || isPending || actionLocked) return;
    const formData = new FormData();
    formData.set('fromUserId', userId);
    formData.set('toUserId', current.user.id);
    formData.set('action', action);
    setActionLocked(true);
    setCardMotion(action);
    if (action === 'like') {
      setShowLikeHeart(true);
    }
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 220));
      const result = await swipeAction(formData);
      if (action === 'like' && result?.matched && result.matchId) {
        setMatchedState({ matchId: result.matchId, target: current });
      }
      setIndex((prev) => prev + 1);
      setIsDetailOpen(false);
      setCardMotion('idle');
      setShowLikeHeart(false);
      setActionLocked(false);
    });
  }

  return (
    <section className='space-y-4 pb-28'>
      <article className='flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
        <div>
          <h2 className='text-base font-bold text-slate-900'>候補カード</h2>
          <p className='text-xs text-slate-500'>軽く判断して、気になった方だけ詳細を確認できます</p>
        </div>
        <button
          type='button'
          onClick={() => setIsDrawerOpen(true)}
          className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700'
        >
          ⚙️ 条件
        </button>
      </article>

      {current ? (
        <article
          className={`overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] transition-all duration-300 ${
            cardMotion === 'skip' ? '-translate-x-6 opacity-0' : ''
          } ${cardMotion === 'like' ? 'translate-x-6 opacity-0' : ''}`}
        >
          <div className='relative aspect-[3/4] w-full max-h-[70vh] min-h-[380px]'>
            <Image src={getMainImage(current)} alt={current.user.nickname} fill className='object-cover' />
            {showLikeHeart ? (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <div className='rounded-full bg-white/85 px-5 py-4 text-5xl text-pink-500 shadow-xl'>♡</div>
              </div>
            ) : null}
            <div className='absolute right-4 top-4 flex flex-col gap-2'>
              <Badge tone='green'>本人確認済み</Badge>
              {current.user.gender === 'female' && current.femaleProfile?.nurseVerificationStatus === 'approved' ? <Badge tone='pink'>プロフィール確認済み</Badge> : null}
              {current.user.gender === 'male' && current.maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>男性審査通過</Badge> : null}
            </div>
            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent p-5'>
              <p className='text-3xl font-bold tracking-tight text-white'>{cardTitle}</p>
              <p className='mt-1 text-sm text-slate-200'>{current.user.location}</p>
              <p className='mt-1 text-xs text-slate-200'>職種 {getJobLabel(current)}</p>
            </div>
          </div>
          <div className='space-y-4 p-5'>
            <p className='rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700'>
              {current.user.bio.length > 50 ? `${current.user.bio.slice(0, 50)}...` : current.user.bio}
            </p>
            <button
              type='button'
              onClick={() => setIsDetailOpen(true)}
              className='h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700'
            >
              詳細を見る
            </button>
            <p className='text-center text-xs text-slate-500'>残り {remaining} 名</p>
          </div>
        </article>
      ) : (
        <article className='rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-600 shadow-sm'>
          本日の候補を見終わりました。条件を調整して再検索してください。
        </article>
      )}

      {isDrawerOpen ? (
        <div className='fixed inset-0 z-40 bg-slate-950/35 p-4' role='dialog' aria-modal='true'>
          <div className='mx-auto mt-16 w-full max-w-[430px] rounded-3xl border border-slate-100 bg-white p-4 shadow-xl'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-sm font-bold text-slate-900'>検索条件</h3>
              <button type='button' onClick={() => setIsDrawerOpen(false)} className='rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600'>
                閉じる
              </button>
            </div>
            <form action='/home/female' className='space-y-2 rounded-2xl bg-slate-50 p-3'>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <input name='ageMin' defaultValue={String(filters.ageMin)} placeholder='年齢下限' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='ageMax' defaultValue={String(filters.ageMax)} placeholder='年齢上限' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='location' defaultValue={filters.location} placeholder='地域' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='job' defaultValue={filters.job} placeholder='職種' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='incomeMin' defaultValue={filters.incomeMin} placeholder='最低年収（例: 500万円）' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='heightMin' defaultValue={String(filters.heightMin || '')} placeholder='最低身長' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='smoking' defaultValue={filters.smoking} placeholder='喫煙' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
                <input name='drinking' defaultValue={filters.drinking} placeholder='飲酒' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              </div>
              <select name='maritalFilter' defaultValue={filters.maritalFilter} className='h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs'>
                <option value='single_only'>独身のみ</option>
                <option value='include_married'>既婚含む</option>
                <option value='include_partner'>パートナーあり含む</option>
              </select>
              <div className='grid grid-cols-2 gap-2 text-xs text-slate-600'>
                <label className='flex items-center gap-2'><input type='checkbox' name='verifiedOnly' defaultChecked={filters.verifiedOnly} /> 本人確認済みのみ</label>
                <label className='flex items-center gap-2'><input type='checkbox' name='maleReviewedOnly' defaultChecked={filters.maleReviewedOnly} /> 男性審査通過のみ</label>
                <label className='flex items-center gap-2'><input type='checkbox' name='incomeVerifiedOnly' defaultChecked={filters.incomeVerifiedOnly} /> 年収確認済みのみ</label>
                <label className='flex items-center gap-2'><input type='checkbox' name='facePhotoOnly' defaultChecked={filters.facePhotoOnly} /> 顔写真ありのみ</label>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <button className='h-10 rounded-xl border border-slate-200 bg-white text-sm'>この条件で探す</button>
                <button formAction={setFemaleSearchPreferenceAction} className='h-10 rounded-xl bg-slate-900 text-sm font-semibold text-white'>
                  条件を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ProfileDetailModal
        isOpen={isDetailOpen && Boolean(current)}
        onClose={() => setIsDetailOpen(false)}
        user={current?.user ?? null}
        maleProfile={current?.maleProfile ?? null}
        femaleProfile={current?.femaleProfile ?? null}
        profileImages={current?.profileImages ?? []}
        viewerUserId={userId}
        onSkip={async () => {
          setIsDetailOpen(false);
          submitSwipe('skip');
        }}
        onLike={async () => {
          setIsDetailOpen(false);
          submitSwipe('like');
        }}
        skipDisabled={!current || isPending || actionLocked}
        likeDisabled={!current || isPending || actionLocked}
      />

      {matchedState ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4' role='dialog' aria-modal='true'>
          <div className='w-full max-w-[360px] rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-2xl'>
            <p className='text-5xl text-pink-500'>♡</p>
            <p className='mt-2 text-xl font-bold text-slate-900'>マッチしました</p>
            <p className='mt-1 text-xs text-slate-500'>安心して会話を始めましょう</p>
            <div className='mt-4 flex items-center justify-center gap-3'>
              <Image src={matchedState.target.user.profileImageUrl} alt={matchedState.target.user.nickname} width={68} height={68} className='h-17 w-17 rounded-2xl object-cover' />
              <span className='text-xl text-slate-300'>×</span>
              <Image src={selfProfileImageUrl} alt='あなた' width={68} height={68} className='h-17 w-17 rounded-2xl object-cover' />
            </div>
            <p className='mt-2 text-sm text-slate-700'>{matchedState.target.user.nickname} さん</p>
            <div className='mt-5 grid grid-cols-2 gap-2'>
              <button onClick={() => setMatchedState(null)} className='h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600'>
                あとで
              </button>
              <Link href={`/chats/${matchedState.matchId}`} className='flex h-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white'>
                メッセージを送る
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className='fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3'>
        <div className='grid grid-cols-2 gap-3'>
          <button
            type='button'
            disabled={!current || isPending || actionLocked}
            onClick={() => submitSwipe('skip')}
            className='h-14 rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-600 shadow-sm disabled:opacity-50'
          >
            Skip
          </button>
          <button
            type='button'
            disabled={!current || isPending || actionLocked}
            onClick={() => submitSwipe('like')}
            className='h-14 rounded-2xl bg-slate-900 text-base font-bold text-white shadow-lg shadow-slate-900/20 disabled:opacity-50'
          >
            ♡ Like
          </button>
        </div>
      </div>
    </section>
  );
}
