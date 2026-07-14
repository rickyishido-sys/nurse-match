import { ResetPasswordForm } from '@/components/connection/auth/reset-password-form';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'パスワード再設定',
  robots: { index: false, follow: false },
};

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === 'string' ? params.error : '';

  if (!user) {
    return <ResetPasswordForm error='session' />;
  }

  if (error) {
    return <ResetPasswordForm error={error} />;
  }

  return <ResetPasswordForm />;
}
