import {
  adminApproveIdentityAction,
  adminRejectIdentityAction,
  adminRequestIdentityResubmitAction,
} from '@/lib/connection/hanakai-admin-actions';
import type { AdminIdentityReviewRow } from '@/lib/connection/hanakai-admin-types';
import { IDENTITY_STATUS_LABEL } from '@/lib/connection/identity-verification';

type Props = {
  row: AdminIdentityReviewRow;
};

export function HanakaiAdminIdentityReviewActions({ row }: Props) {
  return (
    <div className='space-y-3 rounded-2xl border border-[#ebe7dd] bg-[#fafaf8] p-4'>
      <p className='text-xs font-semibold text-[#1a1a1a]'>審査操作</p>
      <p className='text-[10px] text-[#9a9a9a]'>
        状態: {IDENTITY_STATUS_LABEL[row.identityStatus === 'pending' ? 'pending' : 'resubmission_required']}
      </p>

      <form action={adminApproveIdentityAction} className='space-y-2'>
        <input type='hidden' name='memberId' value={row.memberId} />
        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>承認メモ（任意）</span>
          <textarea
            name='note'
            rows={2}
            placeholder='審査メモ'
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          />
        </label>
        <button
          type='submit'
          className='h-9 w-full rounded-full bg-[#1f5d4f] text-[11px] font-semibold text-white'
        >
          承認（本人確認済み）
        </button>
      </form>

      <form action={adminRequestIdentityResubmitAction} className='space-y-2'>
        <input type='hidden' name='memberId' value={row.memberId} />
        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>再提出依頼メモ（必須）</span>
          <textarea
            name='note'
            rows={2}
            required
            placeholder='再提出の理由'
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          />
        </label>
        <button
          type='submit'
          className='h-9 w-full rounded-full border border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-800'
        >
          再提出依頼
        </button>
      </form>

      <form action={adminRejectIdentityAction} className='space-y-2'>
        <input type='hidden' name='memberId' value={row.memberId} />
        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>却下メモ（必須）</span>
          <textarea
            name='note'
            rows={2}
            required
            placeholder='却下理由'
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          />
        </label>
        <button
          type='submit'
          className='h-9 w-full rounded-full border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700'
        >
          却下
        </button>
      </form>
    </div>
  );
}
