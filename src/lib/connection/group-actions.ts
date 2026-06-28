'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canAccessGroup } from '@/lib/connection/group-access';
import {
  createGroupPhotosFromFiles,
  createGroupPost,
  hideGroupPhoto,
  hideGroupPost,
  refreshGroupMembership,
  reportGroupPhoto,
  reportGroupPost,
  requestPhotoUsage,
} from '@/lib/connection/group-repo';
import { ensureViewerMemberId } from '@/lib/connection/identity';
import type { GroupPhotoUsageScope } from '@/lib/connection/types';

async function assertGroupAccess(eventId: string) {
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/groups/${eventId}?denied=1`);
  const access = await canAccessGroup(eventId, memberId);
  if (!access.ok) redirect(`/groups/${eventId}?denied=1`);
  const group = await refreshGroupMembership(eventId);
  if (!group) redirect(`/groups/${eventId}?error=1`);
  return { memberId, group, isAdmin: access.isAdmin };
}

function revalidateGroup(eventId: string) {
  revalidatePath(`/groups/${eventId}`);
}

export async function postGroupMessageAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const photoFiles = formData.getAll('photos').filter((v): v is File => v instanceof File && v.size > 0);
  const consent = formData.get('consent') === 'on';

  if (!eventId) return;
  if (!body && photoFiles.length === 0) return;
  if (photoFiles.length > 0 && !consent) return;

  const { memberId, group } = await assertGroupAccess(eventId);

  let postId: string | undefined;
  if (body) {
    const post = await createGroupPost(group.id, memberId, body);
    postId = post?.id;
  }

  if (photoFiles.length > 0) {
    await createGroupPhotosFromFiles(group.id, memberId, photoFiles, postId);
  }

  revalidateGroup(eventId);
}

export async function reportGroupPostAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const postId = String(formData.get('postId') ?? '').trim();
  if (!eventId || !postId) return;
  await assertGroupAccess(eventId);
  await reportGroupPost(postId);
  revalidateGroup(eventId);
}

export async function reportGroupPhotoAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const photoId = String(formData.get('photoId') ?? '').trim();
  if (!eventId || !photoId) return;
  await assertGroupAccess(eventId);
  await reportGroupPhoto(photoId);
  revalidateGroup(eventId);
}

export async function hideGroupPostAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const postId = String(formData.get('postId') ?? '').trim();
  if (!eventId || !postId) return;
  const { isAdmin } = await assertGroupAccess(eventId);
  if (!isAdmin) return;
  await hideGroupPost(postId);
  revalidateGroup(eventId);
}

export async function hideGroupPhotoAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const photoId = String(formData.get('photoId') ?? '').trim();
  if (!eventId || !photoId) return;
  const { isAdmin } = await assertGroupAccess(eventId);
  if (!isAdmin) return;
  await hideGroupPhoto(photoId);
  revalidateGroup(eventId);
}

export async function requestPhotoUsageAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const photoId = String(formData.get('photoId') ?? '').trim();
  if (!eventId || !photoId) return;
  const { isAdmin } = await assertGroupAccess(eventId);
  if (!isAdmin) return;

  const scopes: GroupPhotoUsageScope[] = ['site', 'event_page'];
  const message =
    'この写真をHANAKAIの紹介素材として使ってもよいですか？利用範囲：HANAKAIサイト内、次回イベントページ';

  await requestPhotoUsage(photoId, scopes, message);
  revalidateGroup(eventId);
}
