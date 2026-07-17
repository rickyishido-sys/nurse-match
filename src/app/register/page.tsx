import { redirect } from 'next/navigation';
import { RegisterEmailForm } from '@/components/register-email-form';
import { BrandAuthFrame, BrandAuthLinks } from '@/components/connection/brand/brand-auth-frame';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { isDevAuthBypassEnabled } from '@/lib/connection/legal-consent';
import { ensureHanakaiMemberForAuthUser } from '@/lib/connection/identity';
import { getHanakaiRegistrationStatus, resolveJoinHref } from '@/lib/connection/registration-status';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function safeDecode(value: string) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveRegisterErrorMessage(error: string, detail: string) {
  if (error === 'duplicate-email') {
    return 'このメールアドレスはすでに登録されています。届いた認証メールのリンクから続けてください。';
  }
  if (error === 'email-required') {
    return 'メールアドレスを入力してください。';
  }
  if (error === 'config') {
    return '認証設定の読み込みに失敗しました。時間をおいて再度お試しください。';
  }
  if (error === 'session_not_found') {
    return '認証セッションの確認に時間がかかっています。少し時間をおいてもう一度お試しください。';
  }
  if (error === 'auth-callback') {
    if (detail.includes('exchange_failed') || detail.includes('verify_failed')) {
      return '認証リンクの確認に失敗しました。もう一度メールのリンクをお試しください。';
    }
    return '認証リンクの有効期限切れ、またはブラウザ引き継ぎに失敗しました。再度メール認証をお試しください。';
  }
  if (error === 'send-failed' || error === 'supabase') {
    const text = detail.toLowerCase();
    if (text.includes('rate limit') || text.includes('too many') || text.includes('over_email_send_rate_limit')) {
      return '短時間に複数回送信されたため、少し時間をおいて再度お試しください。';
    }
    return '認証リンク送信に失敗しました。時間をおいて再度お試しください。';
  }
  return '';
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};

  if (HANAKAI_CONNECTION_BACKEND === 'supabase') {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureHanakaiMemberForAuthUser(user.id, {
          email: user.email,
          nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
        });
      }
    }
  }

  const registration = await getHanakaiRegistrationStatus();
  if (registration.isAuthenticated) {
    redirect(resolveJoinHref(registration));
  }

  const sent = pickFirst(params.sent);
  const error = pickFirst(params.error);
  const detail = safeDecode(pickFirst(params.detail));
  const sentEmail = safeDecode(pickFirst(params.sentEmail));
  const burst = isDevAuthBypassEnabled();
  const legacyFlow = pickFirst(params.legacy) === '1';
  const errorMessage = resolveRegisterErrorMessage(error, detail);

  return (
    <BrandAuthFrame title='新規登録' subtitle='まずはメール認証から始めます' characterId='W'>
      {sent === '1' ? (
        <p className='mb-4 rounded-2xl border border-[#d8e2d3] bg-[#eef4ea]/90 px-4 py-3 text-xs leading-5 text-[#4f7a4a]'>
          認証メールを送信しました。メール内のリンクを開くと、プロフィール入力画面へ進みます。
          {sentEmail ? <span className='mt-1 block break-all text-[11px]'>送信先: {sentEmail}</span> : null}
        </p>
      ) : null}
      {errorMessage ? (
        <div className='mb-4 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs leading-5 text-rose-700'>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <RegisterEmailForm sent={sent === '1'} allowBurst={burst} legacyFlow={legacyFlow} />
      <BrandAuthLinks register />
    </BrandAuthFrame>
  );
}
