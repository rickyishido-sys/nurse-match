'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  setAdminEventNote,
  setAdminEventStatus,
  setHostApplicationNote,
  setHostApplicationStatus,
  setUserHostStatus,
  setUserNote,
  setUserStatus,
  setUserVerification,
} from '@/lib/connection/admin-data';
import type {
  AdminEventStatus,
  HostStatus,
  UserStatus,
  VerificationStatus,
} from '@/lib/connection/admin-types';

const BASE = '/admin/connection';

// --- ユーザー管理 ---

export async function updateUserVerificationAction(formData: FormData) {
  const id = String(formData.get('userId') ?? '');
  const verification = String(formData.get('verification') ?? '') as VerificationStatus;
  if (id && verification) setUserVerification(id, verification);
  revalidatePath(`${BASE}/users`);
  revalidatePath(BASE);
  redirect(`${BASE}/users?updated=${id}`);
}

export async function updateUserStatusAction(formData: FormData) {
  const id = String(formData.get('userId') ?? '');
  const status = String(formData.get('status') ?? '') as UserStatus;
  if (id && status) setUserStatus(id, status);
  revalidatePath(`${BASE}/users`);
  revalidatePath(BASE);
  redirect(`${BASE}/users?updated=${id}`);
}

export async function updateUserHostAction(formData: FormData) {
  const id = String(formData.get('userId') ?? '');
  const hostStatus = String(formData.get('hostStatus') ?? '') as HostStatus;
  if (id && hostStatus) setUserHostStatus(id, hostStatus);
  revalidatePath(`${BASE}/users`);
  revalidatePath(`${BASE}/hosts`);
  redirect(`${BASE}/users?updated=${id}`);
}

export async function updateUserNoteAction(formData: FormData) {
  const id = String(formData.get('userId') ?? '');
  const note = String(formData.get('note') ?? '');
  if (id) setUserNote(id, note);
  revalidatePath(`${BASE}/users`);
  redirect(`${BASE}/users?updated=${id}`);
}

// --- イベント審査 ---

export async function updateAdminEventStatusAction(formData: FormData) {
  const id = String(formData.get('eventId') ?? '');
  const status = String(formData.get('status') ?? '') as AdminEventStatus;
  const returnReason = String(formData.get('returnReason') ?? '');
  if (id && status) setAdminEventStatus(id, status, returnReason);
  revalidatePath(`${BASE}/events`);
  revalidatePath(`${BASE}/events/${id}`);
  revalidatePath(BASE);
  redirect(`${BASE}/events?updated=${id}`);
}

export async function updateAdminEventNoteAction(formData: FormData) {
  const id = String(formData.get('eventId') ?? '');
  const note = String(formData.get('note') ?? '');
  if (id) setAdminEventNote(id, note);
  revalidatePath(`${BASE}/events`);
  revalidatePath(`${BASE}/events/${id}`);
  redirect(`${BASE}/events/${id}?updated=1`);
}

// --- Host申請管理 ---

export async function updateHostApplicationAction(formData: FormData) {
  const id = String(formData.get('applicationId') ?? '');
  const status = String(formData.get('status') ?? '') as HostStatus;
  if (id && status) setHostApplicationStatus(id, status);
  revalidatePath(`${BASE}/hosts`);
  revalidatePath(`${BASE}/users`);
  revalidatePath(BASE);
  redirect(`${BASE}/hosts?updated=${id}`);
}

export async function updateHostApplicationNoteAction(formData: FormData) {
  const id = String(formData.get('applicationId') ?? '');
  const note = String(formData.get('note') ?? '');
  if (id) setHostApplicationNote(id, note);
  revalidatePath(`${BASE}/hosts`);
  redirect(`${BASE}/hosts?updated=${id}`);
}
