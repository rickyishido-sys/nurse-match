'use client';

import { adminUpdateEventRecruitmentAction } from '@/lib/connection/hanakai-admin-actions';

type Props = {
  eventId: string;
  recruitmentType: 'standard' | 'additional';
};

export function AdminEventRecruitmentToggle({ eventId, recruitmentType }: Props) {
  return (
    <form action={adminUpdateEventRecruitmentAction} className='flex flex-col gap-2'>
      <input type='hidden' name='eventId' value={eventId} />
      <label className='flex cursor-pointer items-center gap-2 text-[11px] text-[#4a4a4a]'>
        <input
          type='radio'
          name='recruitmentType'
          value='standard'
          defaultChecked={recruitmentType === 'standard'}
          className='accent-[#1f5d4f]'
        />
        通常募集
      </label>
      <label className='flex cursor-pointer items-center gap-2 text-[11px] text-[#4a4a4a]'>
        <input
          type='radio'
          name='recruitmentType'
          value='additional'
          defaultChecked={recruitmentType === 'additional'}
          className='accent-[#c0526b]'
        />
        追加募集
      </label>
      <button
        type='submit'
        className='mt-1 w-fit rounded-full border border-[#e2ddd2] bg-white px-3 py-1 text-[10px] font-medium text-[#1f5d4f] transition hover:bg-[#f3f7f5]'
      >
        更新
      </button>
    </form>
  );
}
