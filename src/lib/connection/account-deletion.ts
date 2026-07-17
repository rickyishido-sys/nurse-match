import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { WITHDRAWN_MEMBER_LABEL } from '@/lib/connection/member-status';

export type DeleteHanakaiAccountInput = {
  memberId: string;
  authUserId: string;
  reason?: string | null;
};

async function purgeMemberRelatedData(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  memberId: string,
  authUserId: string,
): Promise<void> {
  const { data: hostedEvents } = await admin
    .from('hanakai_events')
    .select('id')
    .eq('host_member_id', memberId);
  const eventIds = (hostedEvents ?? []).map((row) => row.id as string);

  const groupIds = new Set<string>();
  if (eventIds.length > 0) {
    const { data: eventGroups } = await admin
      .from('hanakai_connection_groups')
      .select('id')
      .in('event_id', eventIds);
    for (const row of eventGroups ?? []) {
      groupIds.add(row.id as string);
    }
  }

  const { data: memberGroups } = await admin
    .from('hanakai_group_members')
    .select('group_id')
    .eq('member_id', memberId);
  for (const row of memberGroups ?? []) {
    groupIds.add(row.group_id as string);
  }

  const groupIdList = [...groupIds];

  if (groupIdList.length > 0) {
    const { data: groupPhotos } = await admin
      .from('hanakai_group_photos')
      .select('id')
      .or(`member_id.eq.${memberId},group_id.in.(${groupIdList.join(',')})`);
    const photoIds = (groupPhotos ?? []).map((row) => row.id as string);
    if (photoIds.length > 0) {
      await admin.from('hanakai_group_photo_usage_requests').delete().in('photo_id', photoIds);
    }
    await admin
      .from('hanakai_group_photos')
      .delete()
      .or(`member_id.eq.${memberId},group_id.in.(${groupIdList.join(',')})`);
    await admin
      .from('hanakai_group_posts')
      .delete()
      .or(`member_id.eq.${memberId},group_id.in.(${groupIdList.join(',')})`);
    await admin.from('hanakai_group_members').delete().eq('member_id', memberId);
    await admin.from('hanakai_connection_groups').delete().in('id', groupIdList);
  } else {
    await admin.from('hanakai_group_members').delete().eq('member_id', memberId);
  }

  if (eventIds.length > 0) {
    await admin.from('hanakai_event_applications').delete().in('event_id', eventIds);
    await admin.from('hanakai_events').delete().in('id', eventIds);
  }

  await admin.from('hanakai_event_applications').delete().eq('member_id', memberId);
  await admin.from('hanakai_bloom_timeline').delete().eq('member_id', memberId);
  await admin.from('hanakai_bloom_memories').delete().eq('member_id', memberId);
  await admin.from('hanakai_bloom_versions').delete().eq('member_id', memberId);
  await admin.from('hanakai_bloom_profiles').delete().eq('member_id', memberId);
  await admin.from('hanakai_member_photos').delete().eq('member_id', memberId);
  await admin.from('hanakai_member_social_links').delete().eq('member_id', memberId);
  await admin
    .from('hanakai_reports')
    .delete()
    .or(`reporter_member_id.eq.${memberId},target_member_id.eq.${memberId},resolved_by_member_id.eq.${memberId}`);
  await admin.from('hanakai_contact_inquiries').delete().eq('member_id', memberId);
  await admin
    .from('hanakai_blocks')
    .delete()
    .or(`blocker_member_id.eq.${memberId},blocked_member_id.eq.${memberId}`);
  await admin.from('identity_documents').delete().eq('user_id', authUserId);
}

export async function deleteHanakaiAccount(input: DeleteHanakaiAccountInput): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    console.error('HANAKAI_ACCOUNT_DELETE_ADMIN_UNAVAILABLE');
    throw new Error('アカウント削除に失敗しました');
  }

  const now = new Date().toISOString();

  const { error: requestError } = await admin.from('hanakai_account_deletion_requests').insert({
    member_id: input.memberId,
    auth_user_id: input.authUserId,
    reason: input.reason?.trim() || null,
    status: 'processing',
    requested_at: now,
  });

  if (requestError) {
    console.error('HANAKAI_ACCOUNT_DELETE_REQUEST_FAILED', {
      memberId: input.memberId,
      message: requestError.message,
    });
    throw new Error('削除リクエストの保存に失敗しました');
  }

  try {
    await purgeMemberRelatedData(admin, input.memberId, input.authUserId);

    const { error: memberError } = await admin
      .from('hanakai_members')
      .update({
        auth_user_id: null,
        status: 'deleted',
        deleted_at: now,
        nickname: WITHDRAWN_MEMBER_LABEL,
        bio: '',
        avatar_url: '',
        occupation: '',
        values: {},
        purposes: [],
        interest_tags: [],
        trust_notes: null,
        external_verification_ref: null,
        updated_at: now,
      })
      .eq('id', input.memberId)
      .eq('auth_user_id', input.authUserId);

    if (memberError) {
      throw new Error(memberError.message);
    }

    await admin.from('users').delete().eq('id', input.authUserId).eq('role', 'user');

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(input.authUserId);
    if (authDeleteError) {
      throw new Error(authDeleteError.message);
    }

    await admin
      .from('hanakai_account_deletion_requests')
      .update({ status: 'completed', completed_at: now })
      .eq('member_id', input.memberId)
      .eq('auth_user_id', input.authUserId);
  } catch (error) {
    console.error('HANAKAI_ACCOUNT_DELETE_FAILED', {
      memberId: input.memberId,
      message: String(error),
    });
    await admin
      .from('hanakai_account_deletion_requests')
      .update({ status: 'failed', completed_at: now })
      .eq('member_id', input.memberId)
      .eq('auth_user_id', input.authUserId);
    throw new Error('アカウント削除に失敗しました');
  }
}

/** @deprecated Use deleteHanakaiAccount */
export async function softDeleteHanakaiAccount(input: DeleteHanakaiAccountInput): Promise<void> {
  return deleteHanakaiAccount(input);
}
