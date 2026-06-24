'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  applyToEvent,
  confirmMemberForEvent,
  removeMemberFromEvent,
  saveMemberPersonality,
  updateMember,
  updateMemberTrust,
} from '@/lib/connection/data';
import { VALUE_TAG_LABEL } from '@/lib/connection/data';
import type {
  ConnectionPurpose,
  InterestTag,
  LifePhase,
  PersonalityType,
  TrustVerificationStatus,
  ValueTag,
  VerificationSource,
} from '@/lib/connection/types';

const MOCK_VIEWER_ID = 'm1';

export async function applyConnectionEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  console.log('CONNECTION_APPLY', { eventId, memberId: MOCK_VIEWER_ID });
  if (eventId) applyToEvent(eventId, MOCK_VIEWER_ID);
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/manage');
  redirect(`/events/${eventId}?applied=1`);
}

export async function confirmMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_CONFIRM', { eventId, memberId });
  if (eventId && memberId) confirmMemberForEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function removeMemberAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_REMOVE', { eventId, memberId });
  if (eventId && memberId) removeMemberFromEvent(eventId, memberId);
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

  const purposes = formData.getAll('purposes') as ConnectionPurpose[];
  const interestTags = formData.getAll('interestTags') as InterestTag[];
  const valueTags = formData.getAll('valueTags') as ValueTag[];
  const lifePhase = String(formData.get('lifePhase') ?? 'other') as LifePhase;

  // valueTags を coreValues（表示用文字列）にも反映し、既存構造との互換を維持する
  const explicitCoreValues = String(formData.get('coreValues') ?? '').trim();
  const coreValues =
    explicitCoreValues || valueTags.map((tag) => VALUE_TAG_LABEL[tag]).filter(Boolean).join('、');

  updateMember(MOCK_VIEWER_ID, {
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
    saveMemberPersonality(MOCK_VIEWER_ID, {
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
  revalidatePath('/register/profile');
  revalidatePath('/manage');
  redirect('/register/complete');
}

export async function savePersonalityAction(formData: FormData) {
  const type = String(formData.get('type') ?? '') as PersonalityType;
  const energy = String(formData.get('energy') ?? 'introvert') as 'extravert' | 'introvert';
  const thinking = String(formData.get('thinking') ?? 'feeling') as 'logic' | 'feeling';
  const planning = String(formData.get('planning') ?? 'flexible') as 'plan' | 'flexible';

  saveMemberPersonality(MOCK_VIEWER_ID, {
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
    updateMemberTrust(memberId, {
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
