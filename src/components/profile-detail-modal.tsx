'use client';

import Image from 'next/image';
import { useMemo, useRef, useState, useTransition, type TouchEvent } from 'react';
import { Badge } from '@/components/badges';
import { UserSafetyMenu } from '@/components/user-safety-menu';
import { maritalStatusLabel } from '@/lib/labels';
import type { AppUser, FemaleProfile, MaleProfile, ProfileImageRecord } from '@/lib/types/domain';

type ProfileDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  maleProfile: MaleProfile | null;
  femaleProfile: FemaleProfile | null;
  profileImages?: ProfileImageRecord[];
  viewerUserId?: string;
  onLike?: () => Promise<void> | void;
  onSkip?: () => Promise<void> | void;
  likeLabel?: string;
  skipLabel?: string;
  likeDisabled?: boolean;
  skipDisabled?: boolean;
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

function profileJobLabel(user: AppUser, maleProfile: MaleProfile | null, femaleProfile: FemaleProfile | null) {
  if (user.gender === 'male') return maleProfile?.job || '未設定';
  return workplaceLabel(femaleProfile?.workplaceType);
}

function normalizeImages(user: AppUser, profileImages: ProfileImageRecord[]) {
  if (profileImages.length > 0) return profileImages;
  return [
    {
      id: `${user.id}-main`,
      userId: user.id,
      imageUrl: user.profileImageUrl,
      sortOrder: 1,
      isMain: true,
      approvedStatus: 'approved' as const,
    },
  ];
}

function sectionValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '未設定';
  return String(value);
}

export function ProfileDetailModal({
  isOpen,
  onClose,
  user,
  maleProfile,
  femaleProfile,
  profileImages = [],
  viewerUserId,
  onLike,
  onSkip,
  likeLabel = '♡ 興味あり',
  skipLabel = 'Skip',
  likeDisabled = false,
  skipDisabled = false,
}: ProfileDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const images = useMemo(() => (user ? normalizeImages(user, profileImages) : []), [user, profileImages]);

  if (!isOpen || !user) return null;

  function requestClose() {
    onClose();
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0]?.clientY ?? touchStartYRef.current;
    const delta = currentY - touchStartYRef.current;
    setDragOffset(Math.max(0, delta));
  }

  function handleTouchEnd() {
    if (dragOffset > 120) {
      setDragOffset(0);
      requestClose();
      touchStartYRef.current = null;
      return;
    }
    setDragOffset(0);
    touchStartYRef.current = null;
  }

  function runSkip() {
    if (skipDisabled || isPending) return;
    startTransition(async () => {
      if (onSkip) {
        await onSkip();
      } else {
        requestClose();
      }
    });
  }

  function runLike() {
    if (likeDisabled || isPending) return;
    startTransition(async () => {
      setShowHeart(true);
      await new Promise((resolve) => setTimeout(resolve, 220));
      if (onLike) {
        await onLike();
      } else {
        requestClose();
      }
      setShowHeart(false);
    });
  }

  return (
    <div className='fixed inset-0 z-[70] animate-[fadeIn_.2s_ease]' role='dialog' aria-modal='true'>
      <button type='button' className='absolute inset-0 bg-slate-950/45' aria-label='閉じる' onClick={requestClose} />
      <div
        className='absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] rounded-t-[28px] border border-slate-100 bg-white shadow-2xl animate-[slideUp_.24s_ease]'
        style={{ height: '90vh', transform: `translateY(${dragOffset}px)`, transition: dragOffset > 0 ? 'none' : 'transform 180ms ease' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className='flex h-full flex-col'>
          <div className='flex items-center justify-between px-4 pb-2 pt-3'>
            <div className='h-1.5 w-12 rounded-full bg-slate-200' />
            <button type='button' onClick={requestClose} className='h-7 w-7 rounded-full border border-slate-200 text-xs text-slate-500'>
              ×
            </button>
          </div>

          <div className='relative mx-4 overflow-hidden rounded-2xl border border-slate-100'>
            <div
              ref={sliderRef}
              onScroll={(event) => {
                const target = event.currentTarget;
                const width = target.clientWidth || 1;
                setCurrentImageIndex(Math.round(target.scrollLeft / width));
              }}
              className='relative flex aspect-[3/4] snap-x snap-mandatory overflow-x-auto scroll-smooth'
            >
              {images.map((image) => (
                <div key={image.id} className='relative h-full w-full shrink-0 snap-center'>
                  <Image src={image.imageUrl} alt={user.nickname} fill className='object-cover' />
                </div>
              ))}
            </div>

            <div className='absolute right-3 top-3 flex flex-col gap-1.5'>
              <Badge tone='green'>本人確認済み</Badge>
              {femaleProfile?.nurseVerificationStatus === 'approved' ? <Badge tone='pink'>看護師確認済み</Badge> : null}
              {maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>男性審査通過</Badge> : null}
            </div>

            <div className='pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5'>
              {images.map((image, idx) => (
                <span key={image.id} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>

            {showHeart ? (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/15'>
                <div className='rounded-full bg-white/90 px-6 py-5 text-5xl text-pink-500 shadow-xl'>♡</div>
              </div>
            ) : null}
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4'>
            <section className='space-y-3'>
              <div className='rounded-2xl border border-slate-100 bg-white p-4'>
                <p className='text-xl font-semibold tracking-tight text-slate-900'>
                  {user.nickname}・{user.age}
                </p>
                <p className='mt-1 text-sm text-slate-600'>{user.location}</p>
                <p className='mt-1 text-sm text-slate-700'>職種: {profileJobLabel(user, maleProfile, femaleProfile)}</p>
              </div>

              <div className='rounded-2xl border border-pink-100 bg-pink-50/50 p-4'>
                <p className='text-base leading-7 text-slate-800'>{user.bio || 'よろしくお願いします。'}</p>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-white p-4'>
                <p className='text-sm font-bold text-slate-900'>仕事</p>
                <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600'>
                  <p>勤務形態: {sectionValue(user.gender === 'female' ? workplaceLabel(femaleProfile?.workplaceType) : maleProfile?.job)}</p>
                  <p>夜勤有無: {user.gender === 'female' ? (femaleProfile?.hasNightShift ? 'あり' : 'なし') : maleProfile?.nightShiftUnderstanding ? '理解あり' : '未設定'}</p>
                  <p>休日: {sectionValue(maleProfile?.holiday)}</p>
                  <p>シフト: {maleProfile?.shiftWorkUnderstanding ? '理解あり' : '未設定'}</p>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-white p-4'>
                <p className='text-sm font-bold text-slate-900'>ライフスタイル</p>
                <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600'>
                  <p>飲酒: {sectionValue(maleProfile?.drinking)}</p>
                  <p>喫煙: {sectionValue(maleProfile?.smoking)}</p>
                  <p>身長: {maleProfile?.height ? `${maleProfile.height}cm` : '未設定'}</p>
                  <p>体型: {sectionValue(maleProfile?.bodyType)}</p>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-white p-4'>
                <p className='text-sm font-bold text-slate-900'>恋愛 / 結婚</p>
                <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600'>
                  <p>婚姻歴: {maleProfile ? maritalStatusLabel(maleProfile.maritalStatus) : '未設定'}</p>
                  <p>子ども: {maleProfile ? (maleProfile.hasChildren ? 'あり' : 'なし') : '未設定'}</p>
                  <p className='col-span-2'>結婚観: {sectionValue(maleProfile?.firstDateCost ? `将来を見据えたい / 初回デート費用: ${maleProfile.firstDateCost}` : '')}</p>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-white p-4'>
                <p className='text-sm font-bold text-slate-900'>趣味・価値観</p>
                <div className='mt-3 text-xs leading-6 text-slate-600'>
                  <p>休日の過ごし方: {sectionValue(maleProfile?.holiday)}</p>
                  <p className='mt-1'>好きなこと: {maleProfile?.personalityTags.length ? maleProfile.personalityTags.join(' / ') : '未設定'}</p>
                </div>
              </div>

              {viewerUserId ? (
                <div className='flex justify-end'>
                  <UserSafetyMenu reporterId={viewerUserId} targetUserId={user.id} />
                </div>
              ) : null}
            </section>
          </div>

          <div className='absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur'>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                disabled={skipDisabled || isPending}
                onClick={runSkip}
                className='h-12 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 disabled:opacity-50'
              >
                {skipLabel}
              </button>
              <button
                type='button'
                disabled={likeDisabled || isPending}
                onClick={runLike}
                className='h-12 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/15 disabled:opacity-50'
              >
                {likeLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(40px);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
