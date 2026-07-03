'use client';

type Props = {
  variant: 'success' | 'error';
  message: string;
};

export function AdminFlashBanner({ variant, message }: Props) {
  const styles =
    variant === 'success'
      ? 'border-[#c8e6d9] bg-[#eef8f3] text-[#1f5d4f]'
      : 'border-[#f0d4d4] bg-[#fdf5f5] text-[#8b3a3a]';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`} role='status'>
      {message}
    </div>
  );
}

export function adminFlashMessage(
  success?: string,
  error?: string,
): { variant: 'success' | 'error'; message: string } | null {
  if (success === 'approved') return { variant: 'success', message: '参加申請を承認しました。' };
  if (success === 'rejected') return { variant: 'success', message: '参加申請を却下しました。' };
  if (success === 'reviewing') return { variant: 'success', message: '通報を確認中に更新しました。' };
  if (success === 'resolved') return { variant: 'success', message: '通報を対応済みにしました。' };
  if (success === 'dismissed') return { variant: 'success', message: '通報を却下（dismissed）しました。' };
  if (error === 'note_required') return { variant: 'error', message: '理由の入力が必要です。' };
  if (error === 'missing_id') return { variant: 'error', message: '対象 ID が見つかりません。' };
  if (error === 'invalid_status') return { variant: 'error', message: '無効なステータスです。' };
  if (error === 'forbidden') return { variant: 'error', message: '管理者権限が必要です。' };
  if (error) return { variant: 'error', message: decodeURIComponent(error) };
  return null;
}
