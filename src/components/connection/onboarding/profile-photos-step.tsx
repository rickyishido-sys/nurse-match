'use client';

import { StepHeading } from '@/components/connection/onboarding/onboarding-ui';
import { ProfilePhotoUploader } from '@/components/connection/profile-photo-uploader';
import type { MemberProfilePhoto } from '@/lib/connection/types';

export function ProfilePhotosStep({
  index,
  art,
  initialPhotos,
}: {
  index: number;
  art?: string;
  initialPhotos?: MemberProfilePhoto[];
}) {
  return (
    <div className='flex flex-1 flex-col'>
      <StepHeading
        index={index}
        art={art}
        title='プロフィール写真を追加しましょう'
        subtitle='最大6枚まで。1枚目がメインプロフィールになります。スキップしてあとから追加することもできます。'
      />
      <div className='mt-8'>
        <ProfilePhotoUploader initialPhotos={initialPhotos} />
      </div>
    </div>
  );
}
