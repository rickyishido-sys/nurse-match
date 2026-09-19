/** HANAKAI パスワード条件。Supabase 既定（最短6）より厳しく、bcrypt 上限 72 に合わせる。 */
export const HANAKAI_PASSWORD_MIN_LENGTH = 8;
export const HANAKAI_PASSWORD_MAX_LENGTH = 72;

export type PasswordValidationCode = 'short' | 'long' | 'mismatch';

export function validateHanakaiPassword(
  password: string,
  confirm: string,
): PasswordValidationCode | null {
  if (password.length < HANAKAI_PASSWORD_MIN_LENGTH) return 'short';
  if (password.length > HANAKAI_PASSWORD_MAX_LENGTH) return 'long';
  if (password !== confirm) return 'mismatch';
  return null;
}

export function passwordValidationMessage(code: PasswordValidationCode): string {
  if (code === 'short') return '8文字以上で入力してください。';
  if (code === 'long') return 'パスワードは72文字以内で入力してください。';
  return 'パスワードが一致していません。';
}

export type PasswordUpdateFailureCode = 'auth' | 'weak' | 'failed';

export function classifyPasswordUpdateError(error: {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}): PasswordUpdateFailureCode {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  if (
    code === 'session_not_found' ||
    message.includes('auth session missing') ||
    message.includes('session_not_found') ||
    message.includes('not authenticated') ||
    error.status === 401
  ) {
    return 'auth';
  }
  if (
    code === 'weak_password' ||
    message.includes('weak_password') ||
    message.includes('pwned') ||
    message.includes('leaked') ||
    message.includes('easy to guess') ||
    message.includes('known to be weak')
  ) {
    return 'weak';
  }
  return 'failed';
}

export function isSamePasswordError(error: { code?: string | null; message?: string | null }): boolean {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  return code === 'same_password' || message.includes('same_password') || message.includes('should be different from the old');
}

export function passwordUpdateFailureMessage(code: PasswordUpdateFailureCode): string {
  if (code === 'auth') {
    return '認証の有効期限が切れています。もう一度認証メールを送信してください。';
  }
  if (code === 'weak') {
    return 'このパスワードは使えないか、推測されやすいため設定できません。別のパスワードを入力してください。';
  }
  return 'パスワードの設定に失敗しました。時間をおいてもう一度お試しください。';
}
