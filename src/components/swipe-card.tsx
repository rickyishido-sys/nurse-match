import Image from 'next/image';
import { Badge } from '@/components/badges';
import { maritalStatusLabel } from '@/lib/labels';
import type { FemaleProfile, MaleProfile, AppUser } from '@/lib/types/domain';

type SwipeCardProps = {
  user: AppUser;
  maleProfile: MaleProfile | null;
  femaleProfile: FemaleProfile | null;
};

export function SwipeCard({ user, maleProfile, femaleProfile }: SwipeCardProps) {
  return (
    <article className='overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.45)]'>
      <div className='relative h-[26rem] w-full'>
        <Image src={user.profileImageUrl} alt={user.nickname} fill className='object-cover' />
        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4'>
          <p className='text-2xl font-bold text-white'>
            {user.nickname} <span className='text-base font-medium text-slate-200'>{user.age}</span>
          </p>
          <p className='text-sm text-slate-200'>{user.location}</p>
        </div>
      </div>

      <div className='space-y-3 p-4'>
        <div className='flex flex-wrap gap-2'>
          <Badge tone='green'>本人確認済み</Badge>
          {user.gender === 'female' && femaleProfile?.nurseVerificationStatus === 'approved' ? (
            <Badge tone='pink'>看護師確認済み</Badge>
          ) : null}
          {maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>男性審査通過</Badge> : null}
          {maleProfile ? <Badge tone='gray'>婚姻: {maritalStatusLabel(maleProfile.maritalStatus)}</Badge> : null}
          {maleProfile?.maritalStatus === 'single' ? <Badge tone='amber'>独身</Badge> : null}
          {maleProfile?.incomeVerified ? <Badge tone='green'>年収確認済み</Badge> : null}
          {maleProfile?.facePhotoVerified ? <Badge tone='green'>顔写真確認済み</Badge> : null}
          {maleProfile?.income ? <Badge tone='gray'>年収 {maleProfile.income}</Badge> : null}
          {maleProfile?.job ? <Badge tone='gray'>職種 {maleProfile.job}</Badge> : null}
        </div>

        {maleProfile ? (
          <div className='grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700'>
            <p>身長: {maleProfile.height}cm</p>
            <p>体型: {maleProfile.bodyType}</p>
            <p>休日: {maleProfile.holiday}</p>
            <p>飲酒: {maleProfile.drinking}</p>
          </div>
        ) : null}

        <p className='rounded-2xl border border-pink-100 bg-pink-50/60 p-3 text-sm leading-6 text-slate-700'>{user.bio}</p>
      </div>
    </article>
  );
}
