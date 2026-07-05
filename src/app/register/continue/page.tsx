import { redirect } from 'next/navigation';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { ensureHanakaiMemberForAuthUser } from '@/lib/connection/identity';
import { getHanakaiRegistrationStatus, resolveJoinHref } from '@/lib/connection/registration-status';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/** メール認証後・トップ「参加する」などの中継。セッションに応じて適切な画面へ送る。 */
export default async function RegisterContinuePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);

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

  const status = await getHanakaiRegistrationStatus();
  if (!status.isAuthenticated) {
    redirect(error ? `/register?error=${encodeURIComponent(error)}` : '/register');
  }

  redirect(resolveJoinHref(status));
}
