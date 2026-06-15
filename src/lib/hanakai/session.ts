import { createServerSupabaseClient } from '@/lib/supabase/server';

export type HanakaiViewer = {
  id: string;
  email: string | null;
  displayName: string;
};

// Lightweight auth read for the HANAKAI shell. Decoupled from the legacy
// dating-domain `users` table; only used to show login/logout state.
export async function getHanakaiViewer(): Promise<HanakaiViewer | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const email = user.email ?? null;
    const metaName = (user.user_metadata?.nickname as string | undefined) ?? null;
    return {
      id: user.id,
      email,
      displayName: metaName ?? (email ? email.split('@')[0] : 'ゲスト'),
    };
  } catch {
    return null;
  }
}
