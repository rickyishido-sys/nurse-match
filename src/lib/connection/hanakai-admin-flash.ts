export type AdminFlashPayload = { variant: 'success' | 'error'; message: string };

export function adminFlashMessage(
  success?: string,
  error?: string,
): AdminFlashPayload | null {
  if (success === 'approved') return { variant: 'success', message: '参加を決定しました。' };
  if (success === 'rejected') return { variant: 'success', message: '参加申請を却下しました。' };
  if (success === 'identity_approved') return { variant: 'success', message: '本人確認を承認しました。' };
  if (success === 'identity_rejected') return { variant: 'success', message: '本人確認を却下しました。' };
  if (success === 'reviewing') return { variant: 'success', message: '通報を確認中に更新しました。' };
  if (success === 'resolved') return { variant: 'success', message: '通報を対応済みにしました。' };
  if (success === 'inquiry_resolved') return { variant: 'success', message: 'お問い合わせを対応済みにしました。' };
  if (success === 'dismissed') return { variant: 'success', message: '通報を却下（dismissed）しました。' };
  if (success === 'note_saved') return { variant: 'success', message: '管理メモを保存しました。' };
  if (success === 'resubmit_requested') return { variant: 'success', message: '本人確認の再提出を依頼しました。' };
  if (success === 'updated' || success === '1') return { variant: 'success', message: '更新しました。' };
  if (error === 'note_required') return { variant: 'error', message: '理由の入力が必要です。' };
  if (error === 'missing_id') return { variant: 'error', message: '対象 ID が見つかりません。' };
  if (error === 'invalid_status') return { variant: 'error', message: '無効なステータスです。' };
  if (error === 'forbidden') return { variant: 'error', message: '管理者権限が必要です。' };
  if (error) return { variant: 'error', message: decodeURIComponent(error) };
  return null;
}
