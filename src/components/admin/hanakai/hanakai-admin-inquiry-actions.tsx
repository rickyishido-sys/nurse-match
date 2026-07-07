'use client';

import { adminResolveInquiryAction } from '@/lib/connection/hanakai-admin-actions';
import type { ContactInquiryStatus } from '@/lib/connection/contact-inquiry';

type Props = {
  inquiryId: string;
  status: ContactInquiryStatus;
};

export function AdminInquiryActions({ inquiryId, status }: Props) {
  if (status === 'resolved') {
    return <span className='text-[11px] text-[#9a9a9a]'>対応済み</span>;
  }

  return (
    <form action={adminResolveInquiryAction}>
      <input type='hidden' name='inquiryId' value={inquiryId} />
      <button
        type='submit'
        className='rounded-full bg-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-white'
      >
        対応済みにする
      </button>
    </form>
  );
}
