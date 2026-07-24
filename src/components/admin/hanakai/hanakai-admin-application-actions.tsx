'use client';

type Props = {
  status: 'confirmed' | 'rejected' | 'awaiting_confirmation' | 'cancelled';
  decidedAt: string | null;
};

export function AdminApplicationProcessed({ status, decidedAt }: Props) {
  const label =
    status === 'confirmed'
      ? '参加確定'
      : status === 'awaiting_confirmation'
        ? '参加確認待ち'
        : status === 'cancelled'
          ? '辞退済み'
          : '今回のご案内なし';
  return (
    <span className='text-[11px] text-[#9a9a9a]'>
      {label}
      {decidedAt ? ` · ${new Date(decidedAt).toLocaleDateString('ja-JP')}` : ''}
    </span>
  );
}
