import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WITHDRAWN_MEMBER_LABEL } from '@/lib/connection/member-status';

export type DeleteHanakaiAccountInput = {
  memberId: string;
  authUserId: string;
  reason?: string | null;
};

export async function softDeleteHanakaiAccount(input: DeleteHanakaiAccountInput): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const now = new Date().toISOString();

  const { error: memberError } = await sb
    .from('hanakai_members')
    .update({
      status: 'deleted',
      deleted_at: now,
      nickname: WITHDRAWN_MEMBER_LABEL,
      bio: '',
      avatar_url: '',
      updated_at: now,
    })
    .eq('id', input.memberId)
    .eq('auth_user_id', input.authUserId);

  if (memberError) {
    console.error('HANAKAI_ACCOUNT_DELETE_MEMBER_FAILED', {
      memberId: input.memberId,
      message: memberError.message,
    });
    throw new Error('アカウント削除に失敗しました');
  }

  const admin = createAdminSupabaseClient();
  const requestClient = admin ?? sb;
  const { error: requestError } = await requestClient.from('hanakai_account_deletion_requests').insert({
    member_id: input.memberId,
    auth_user_id: input.authUserId,
    reason: input.reason?.trim() || null,
    status: 'completed',
    completed_at: now,
  });

  if (requestError) {
    console.error('HANAKAI_ACCOUNT_DELETE_REQUEST_FAILED', {
      memberId: input.memberId,
      message: requestError.message,
    });
    throw new Error('削除リクエストの保存に失敗しました');
  }
}
