'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// HANAKAI MVP actions. Persistence is mocked for now; these validate input,
// log intent, and redirect back so the UI behaves end-to-end. Wire to Supabase
// using supabase/hanakai-schema.sql when ready.

export async function likePostAction(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  console.log('HANAKAI_LIKE_POST', { postId });
  revalidatePath(`/posts/${postId}`);
  revalidatePath('/posts');
}

export async function addCommentAction(formData: FormData) {
  const postId = String(formData.get('postId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  console.log('HANAKAI_ADD_COMMENT', { postId, hasBody: body.length > 0 });
  if (!postId || !body) {
    redirect(`/posts/${postId}?error=empty`);
  }
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}?commented=1`);
}

export async function createPostAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  console.log('HANAKAI_CREATE_POST', { hasTitle: title.length > 0, hasBody: body.length > 0 });
  if (!title) {
    redirect('/posts/new?error=title');
  }
  redirect('/posts?created=1');
}

export async function applyEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  console.log('HANAKAI_APPLY_EVENT', { eventId });
  redirect(`/events/${eventId}?applied=1`);
}

export async function cheerAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  console.log('HANAKAI_CHEER', { projectId, amount });
  redirect(`/support/${projectId}?cheered=1`);
}

export async function connectAction(formData: FormData) {
  const targetId = String(formData.get('targetId') ?? '');
  const kind = String(formData.get('kind') ?? 'follow');
  console.log('HANAKAI_CONNECT', { targetId, kind });
  revalidatePath(`/members/${targetId}`);
  redirect(`/members/${targetId}?connected=${kind}`);
}
