'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  applyToEvent,
  confirmMemberForEvent,
  createEvent,
  rejectApplication,
  removeMemberFromEvent,
  saveMemberPersonality,
  saveMemberPhotos,
  updateMember,
  updateMemberTrust,
} from '@/lib/connection/repo';
import { VALUE_TAG_LABEL } from '@/lib/connection/data';
import { uploadEventImages } from '@/lib/connection/storage';
import { ensureViewerMemberId } from '@/lib/connection/identity';
import type {
  ConnectionEventCategory,
  ConnectionPurpose,
  EventApprovalMode,
  InterestTag,
  LifePhase,
  PersonalityType,
  TrustVerificationStatus,
  ValueTag,
  VerificationSource,
} from '@/lib/connection/types';
import type { PhotoManifestEntry } from '@/lib/connection/repo-supabase';

function parsePhotoManifest(raw: string): PhotoManifestEntry[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is PhotoManifestEntry =>
        (e?.type === 'existing' && typeof e.id === 'string') ||
        (e?.type === 'new' && typeof e.fileIndex === 'number'),
    );
  } catch {
    return [];
  }
}

async function persistProfilePhotos(memberId: string, formData: FormData) {
  const manifest = parsePhotoManifest(String(formData.get('photoManifest') ?? '[]'));
  const files = formData.getAll('profileImages').filter((v): v is File => v instanceof File && v.size > 0);
  if (manifest.length === 0 && files.length === 0) return;
  await saveMemberPhotos(memberId, manifest, files);
}

const VALID_CATEGORIES: ConnectionEventCategory[] = [
  'flower',
  'coffee',
  'business',
  'walking',
  'fitness',
  'learning',
  'bar',
  'sports',
  'workshop',
  'other',
];

export async function createConnectionEventAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const rawCategory = String(formData.get('category') ?? 'other');
  const category = (VALID_CATEGORIES.includes(rawCategory as ConnectionEventCategory)
    ? rawCategory
    : 'other') as ConnectionEventCategory;
  const description = String(formData.get('description') ?? '').trim();
  const startAt = String(formData.get('startAt') ?? '').trim();
  const area = String(formData.get('area') ?? '').trim();
  const venue = String(formData.get('venue') ?? '').trim();
  const capacity = Math.max(2, Math.min(50, Number(formData.get('capacity')) || 6));
  const fee = Math.max(0, Number(formData.get('fee')) || 0);
  const conditions = String(formData.get('conditions') ?? '').trim();
  const imageFiles = formData.getAll('images').filter((v): v is File => v instanceof File);
  const approvalMode = (String(formData.get('approvalMode') ?? 'host_approval') === 'auto'
    ? 'auto'
    : 'host_approval') as EventApprovalMode;

  if (!title || !startAt || !area) {
    redirect('/events/create?error=required');
  }

  const hostId = await ensureViewerMemberId();
  if (!hostId) redirect('/events/create?error=session');

  // 匿名サインイン後のセッションでアップロードできるため、メンバー確定後に実行する。
  const imageUrls = imageFiles.length > 0 ? await uploadEventImages(imageFiles) : [];

  const event = await createEvent({
    title,
    category,
    description,
    startAt,
    area,
    venue,
    capacity,
    fee,
    coverUrl: '',
    conditions,
    approvalMode,
    hostId,
    imageUrls,
  });

  console.log('CONNECTION_EVENT_CREATE', { id: event.id, title, category, approvalMode, images: imageUrls.length });
  revalidatePath('/events');
  revalidatePath('/home');
  redirect(`/events/${event.id}?created=1`);
}

export async function applyConnectionEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/events/${eventId}?error=session`);
  console.log('CONNECTION_APPLY', { eventId, memberId, reasonLength: reason.length });
  if (eventId) await applyToEvent(eventId, memberId, reason);
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/manage');
  revalidatePath(`/events/manage/${eventId}`);
  redirect(`/events/${eventId}?applied=1`);
}

export async function approveApplicationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_HOST_APPROVE', { eventId, memberId });
  if (eventId && memberId) await confirmMemberForEvent(eventId, memberId);
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/manage/${eventId}?approved=${memberId}`);
}

export async function rejectApplicationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_HOST_REJECT', { eventId, memberId });
  if (eventId && memberId) await rejectApplication(eventId, memberId);
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/manage/${eventId}?rejected=${memberId}`);
}

export async function confirmMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_CONFIRM', { eventId, memberId });
  if (eventId && memberId) await confirmMemberForEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function removeMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_REMOVE', { eventId, memberId });
  if (eventId && memberId) await removeMemberFromEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function followMemberAction(formData: FormData) {
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  console.log('CONNECTION_FOLLOW', { memberId, eventId });
  revalidatePath(`/connections/${eventId}`);
  redirect(`/connections/${eventId}?followed=${memberId}`);
}

export async function sendMessageAction(formData: FormData) {
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  console.log('CONNECTION_MESSAGE', { memberId, eventId, hasBody: body.length > 0 });
  revalidatePath(`/connections/${eventId}`);
  redirect(`/connections/${eventId}?messaged=${memberId}`);
}

export async function saveProfileAction(formData: FormData) {
  const nickname = String(formData.get('nickname') ?? '').trim();
  if (!nickname) redirect('/register/profile?error=nickname');

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register/profile?error=session');

  const purposes = formData.getAll('purposes') as ConnectionPurpose[];
  const interestTags = formData.getAll('interestTags') as InterestTag[];
  const valueTags = formData.getAll('valueTags') as ValueTag[];
  const lifePhase = String(formData.get('lifePhase') ?? 'other') as LifePhase;

  // valueTags を coreValues（表示用文字列）にも反映し、既存構造との互換を維持する
  const explicitCoreValues = String(formData.get('coreValues') ?? '').trim();
  const coreValues =
    explicitCoreValues || valueTags.map((tag) => VALUE_TAG_LABEL[tag]).filter(Boolean).join('、');

  await updateMember(memberId, {
    nickname,
    age: Number(formData.get('age') ?? 0),
    gender: String(formData.get('gender') ?? 'other') as 'female' | 'male' | 'other',
    area: String(formData.get('area') ?? '').trim(),
    occupation: String(formData.get('occupation') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
    values: {
      mostImportant: String(formData.get('mostImportant') ?? '').trim(),
      currentChallenge: String(formData.get('currentChallenge') ?? '').trim(),
      futureGoal: String(formData.get('futureGoal') ?? '').trim(),
      recentInspiration: String(formData.get('recentInspiration') ?? '').trim(),
      howOthersSeeMe: String(formData.get('howOthersSeeMe') ?? '').trim(),
      personalityOneWord: String(formData.get('personalityOneWord') ?? '').trim(),
      coreValues,
      valueTags,
    },
    purposes,
    interestTags,
    lifePhase,
  });

  // ステップ式ウィザードから性格診断結果も同時に届く場合は保存する
  const personalityType = String(formData.get('personalityType') ?? '') as PersonalityType | '';
  if (personalityType) {
    await saveMemberPersonality(memberId, {
      type: personalityType,
      axes: {
        energy: String(formData.get('personalityEnergy') ?? 'introvert') as 'extravert' | 'introvert',
        thinking: String(formData.get('personalityThinking') ?? 'feeling') as 'logic' | 'feeling',
        planning: String(formData.get('personalityPlanning') ?? 'flexible') as 'plan' | 'flexible',
      },
      completedAt: new Date().toISOString(),
    });
  }

  console.log('CONNECTION_PROFILE_SAVE', { nickname, purposes, interestTags, valueTags, lifePhase, personalityType });
  await persistProfilePhotos(memberId, formData);
  revalidatePath('/register/profile');
  revalidatePath('/my-profile');
  revalidatePath('/manage');
  redirect('/register/complete');
}

export async function saveMemberPhotosAction(formData: FormData) {
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register/profile?error=session');

  await persistProfilePhotos(memberId, formData);

  revalidatePath('/my-profile');
  revalidatePath('/events');
  revalidatePath('/posts');
  redirect('/my-profile?photos=saved');
}

export async function savePersonalityAction(formData: FormData) {
  const type = String(formData.get('type') ?? '') as PersonalityType;
  const energy = String(formData.get('energy') ?? 'introvert') as 'extravert' | 'introvert';
  const thinking = String(formData.get('thinking') ?? 'feeling') as 'logic' | 'feeling';
  const planning = String(formData.get('planning') ?? 'flexible') as 'plan' | 'flexible';

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register/profile?error=session');

  await saveMemberPersonality(memberId, {
    type,
    axes: { energy, thinking, planning },
    completedAt: new Date().toISOString(),
  });

  console.log('CONNECTION_PERSONALITY_SAVE', { type, energy, thinking, planning });
  revalidatePath('/register/profile');
  revalidatePath('/manage');
  redirect('/register/profile?saved=personality');
}

export async function updateTrustVerificationAction(formData: FormData) {
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const trustVerificationStatus = String(formData.get('trustVerificationStatus') ?? 'pending') as TrustVerificationStatus;
  const verificationSource = String(formData.get('verificationSource') ?? 'none') as VerificationSource;
  const identityVerified = formData.get('identityVerified') === '1';
  const trustNotes = String(formData.get('trustNotes') ?? '').trim() || null;
  const safetyFlags = formData.getAll('safetyFlags').map(String);

  console.log('CONNECTION_TRUST_UPDATE', { memberId, trustVerificationStatus, safetyFlags });

  if (memberId) {
    await updateMemberTrust(memberId, {
      trustVerificationStatus,
      verificationSource,
      identityVerified,
      trustNotes,
      safetyFlags,
    });
  }

  revalidatePath('/manage');
  revalidatePath('/register/profile');
  redirect(`/manage?event=${eventId}&trustUpdated=${memberId}`);
}
