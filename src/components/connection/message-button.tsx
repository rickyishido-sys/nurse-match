'use client';

import { sendMessageAction } from '@/lib/connection/actions';

type MessageButtonProps = {
  memberId: string;
  memberName: string;
  eventId: string;
};

export function ConnectionMessageButton({ memberId, memberName, eventId }: MessageButtonProps) {
  return (
    <form action={sendMessageAction} className='contents'>
      <input type='hidden' name='memberId' value={memberId} />
      <input type='hidden' name='eventId' value={eventId} />
      <input type='hidden' name='body' value={`${memberName}さん、はじめまして。`} />
      <button type='submit' className='h-10 w-full rounded-full bg-[#1a1a1a] text-xs font-semibold text-white'>
        メッセージ
      </button>
    </form>
  );
}
