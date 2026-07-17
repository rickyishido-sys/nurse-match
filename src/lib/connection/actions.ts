'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  applyToEvent,
  confirmMemberForEvent,
  createEvent,
  getApplication,
  getMember,
  rejectApplication,
  removeMemberFromEvent,
  saveMemberPersonality,
  saveMemberPhotos,
  saveMemberSocialLinks,
  updateMember,
  updateMemberTrust,
} from '@/lib/connection/repo';
import { VALUE_TAG_LABEL } from '@/lib/connection/data';
import { TEMPERAMENT_OPTIONS } from '@/lib/connection/onboarding-options';
import { uploadEventImages } from '@/lib/connection/storage';
import { uploadDocument } from '@/lib/upload';
import { ensureViewerMemberId, getAuthenticatedAuthUserId, getViewerMemberId } from '@/lib/connection/identity';
import { deleteHanakaiAccount } from '@/lib/connection/account-deletion';
import {
  HANAKAI_PRIVACY_VERSION,
  HANAKAI_TERMS_VERSION,
  hasRecordedLegalConsent,
} from '@/lib/connection/legal-consent';
import { isDeletedMember } from '@/lib/connection/member-status';
import { requireHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import {
  selectMemberForEvent,
} from '@/lib/connection/participation-confirmation';
import { requireEventHostAccess } from '@/lib/connection/group-access';
import { requireIdentityVerifiedMember } from '@/lib/connection/identity-gate';
import { normalizeSocialLinks } from '@/lib/connection/social-link-normalize';
import { checkIdentityDocumentFileServer } from '@/lib/connection/identity-document-check-server';
import { isHanakaiProfileComplete } from '@/lib/connection/registration-status';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
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
import {
  EVENT_APPLICATION_REASON_MAX,
  EVENT_APPLICATION_REASON_MIN,
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

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT;')
  );
}

function parseImageUrlsField(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0);
  } catch {
    return [];
  }
}

function logCreateEventError(error: unknown, context?: Record<string, unknown>) {
  console.error('CONNECTION_EVENT_CREATE_ERROR', error, context ?? {});
  if (error instanceof Error) {
    console.error('CONNECTION_EVENT_CREATE_ERROR_MESSAGE', error.message);
    console.error('CONNECTION_EVENT_CREATE_ERROR_STACK', error.stack);
  }
  if (typeof error === 'object' && error !== null && ('code' in error || 'details' in error)) {
    const supa = error as { message?: string; code?: string; details?: string; hint?: string };
    console.error('CONNECTION_EVENT_CREATE_ERROR_SUPABASE', {
      message: supa.message ?? null,
      code: supa.code ?? null,
      details: supa.details ?? null,
      hint: supa.hint ?? null,
    });
  }
}

export async function createConnectionEventAction(formData: FormData) {
  try {
    console.log('CONNECTION_EVENT_CREATE_1_START');

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
    const imageUrlsFromClient = parseImageUrlsField(String(formData.get('imageUrls') ?? '[]'));
    const imageFiles = formData.getAll('images').filter((v): v is File => v instanceof File);
    const approvalMode = (String(formData.get('approvalMode') ?? 'host_approval') === 'auto'
      ? 'auto'
      : 'host_approval') as EventApprovalMode;

    console.log('CONNECTION_EVENT_CREATE_3_FORMDATA_OK', {
      titleLength: title.length,
      category,
      startAt: startAt || null,
      areaLength: area.length,
      imageUrlCount: imageUrlsFromClient.length,
      imageFileCount: imageFiles.length,
      approvalMode,
    });

    if (!title || !startAt || !area) {
      console.error('CONNECTION_EVENT_CREATE_VALIDATION_FAIL', {
        hasTitle: Boolean(title),
        hasStartAt: Boolean(startAt),
        hasArea: Boolean(area),
      });
      redirect('/events/create?error=required');
    }
    console.log('CONNECTION_EVENT_CREATE_4_VALIDATION_OK');

    const hostId = await ensureViewerMemberId();
    if (!hostId) {
      console.log('CONNECTION_EVENT_CREATE_2_MEMBER_FAIL');
      redirect('/login?next=/events/create');
    }
    await requireIdentityVerifiedMember(hostId);
    console.log('CONNECTION_EVENT_CREATE_2_MEMBER_OK', { hostId });

    console.log('CONNECTION_EVENT_CREATE_5_IMAGE_START', {
      clientUrlCount: imageUrlsFromClient.length,
      fileCount: imageFiles.length,
    });
    let imageUrls = imageUrlsFromClient;
    if (imageUrls.length === 0 && imageFiles.length > 0) {
      imageUrls = await uploadEventImages(imageFiles);
    }
    console.log('CONNECTION_EVENT_CREATE_6_IMAGE_DONE', { uploadedCount: imageUrls.length });

    console.log('CONNECTION_EVENT_CREATE_7_DB_INSERT_START', { hostId, category });
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
    console.log('CONNECTION_EVENT_CREATE_8_DB_INSERT_DONE', { eventId: event.id });

    console.log('CONNECTION_EVENT_CREATE', { id: event.id, title, category, approvalMode, images: imageUrls.length });
    revalidatePath('/events');
    revalidatePath('/home');
    revalidatePath('/admin/hanakai/events');
    console.log('CONNECTION_EVENT_CREATE_9_REDIRECT', { eventId: event.id });
    redirect(`/events/${event.id}?created=1`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logCreateEventError(error);
    throw error;
  }
}

export async function applyConnectionEventAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`);

  const member = await getMember(memberId);
  if (!isHanakaiProfileComplete(member)) {
    redirect('/register/profile');
  }
  await requireIdentityVerifiedMember(memberId);

  if (eventId) {
    const existing = await getApplication(eventId, memberId);
    if (existing && existing.status !== 'rejected' && existing.status !== 'cancelled') {
      redirect(`/events/${eventId}?applied=1`);
    }
  }

  if (reason.length < EVENT_APPLICATION_REASON_MIN || reason.length > EVENT_APPLICATION_REASON_MAX) {
    redirect(`/events/${eventId}?error=reason`);
  }

  console.log('CONNECTION_APPLY', { eventId, memberId, reasonLength: reason.length });
  if (eventId) await applyToEvent(eventId, memberId, reason);
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/manage');
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath('/admin/hanakai/applications');
  revalidatePath('/admin/hanakai');
  redirect(`/events/${eventId}?applied=1`);
}

export async function approveApplicationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  if (!eventId || !memberId) redirect('/events');
  const hostId = await ensureViewerMemberId();
  if (!hostId) redirect(`/login?next=/events/manage/${eventId}`);
  await requireIdentityVerifiedMember(hostId);
  await requireEventHostAccess(eventId);
  console.log('CONNECTION_HOST_APPROVE', { eventId, memberId });
  const result = await selectMemberForEvent(eventId, memberId);
  if (!result.ok) {
    redirect(`/events/manage/${eventId}?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/manage/${eventId}?approved=${memberId}`);
}

export async function rejectApplicationAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  if (!eventId || !memberId) redirect('/events');
  await requireEventHostAccess(eventId);
  console.log('CONNECTION_HOST_REJECT', { eventId, memberId });
  await rejectApplication(eventId, memberId);
  revalidatePath(`/events/manage/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/manage/${eventId}?rejected=${memberId}`);
}

export async function confirmMemberAction(formData: FormData) {
  await requireHanakaiAdminAccess('/manage');
  const eventId = String(formData.get('eventId') ?? '');
  const memberId = String(formData.get('memberId') ?? '');
  console.log('CONNECTION_CONFIRM', { eventId, memberId });
  if (eventId && memberId) await confirmMemberForEvent(eventId, memberId);
  revalidatePath('/manage');
  redirect(`/manage?event=${eventId}`);
}

export async function removeMemberAction(formData: FormData) {
  await requireHanakaiAdminAccess('/manage');
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
  revalidatePath(`/connections/${eventId}`);
  redirect(`/connections/${eventId}?followed=${memberId}`);
}

export async function setRegistrationPasswordAction(formData: FormData) {
  console.log('BLOOM_PASSWORD_UPDATE_START');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  if (password.length < 8) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'password_too_short' });
    return { error: 'short' as const };
  }
  if (password !== confirm) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'password_mismatch' });
    return { error: 'mismatch' as const };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'missing_supabase_client' });
    return { error: 'config' as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'auth_user_missing' });
    return { error: 'auth' as const };
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: { hanakai_password_set: true },
  });
  if (error) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: error.message, userId: user.id });
    return { error: 'failed' as const, detail: error.message };
  }

  console.log('BLOOM_PASSWORD_UPDATE_SUCCESS', { userId: user.id });
  return { ok: true as const };
}

export async function recordLegalConsentAction(formData: FormData) {
  const terms = formData.get('terms') === '1';
  const privacy = formData.get('privacy') === '1';
  if (!terms || !privacy) {
    throw new Error('利用規約とプライバシーポリシーの同意が必要です');
  }

  const memberId = await getViewerMemberId();
  if (!memberId) {
    redirect('/register?hint=auth-required');
  }

  const sb = await createServerSupabaseClient();
  if (!sb) {
    throw new Error('Supabase client unavailable');
  }

  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) {
    redirect('/register?hint=auth-required');
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await sb
    .from('hanakai_members')
    .update({
      terms_agreed_at: now,
      privacy_agreed_at: now,
      terms_version: HANAKAI_TERMS_VERSION,
      privacy_version: HANAKAI_PRIVACY_VERSION,
      updated_at: now,
    })
    .eq('id', memberId)
    .eq('auth_user_id', authUserId)
    .select('id')
    .maybeSingle();

  if (error || !updated?.id) {
    console.error('HANAKAI_LEGAL_CONSENT_FAILED', { memberId, message: error.message });
    throw new Error('同意の保存に失敗しました');
  }

  revalidatePath('/register/profile');
}

export async function saveProfileAction(formData: FormData) {
  const nickname = String(formData.get('nickname') ?? '').trim();
  if (!nickname) redirect('/register/profile?error=nickname');

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register');

  const existingMember = await getMember(memberId);
  if (!hasRecordedLegalConsent(existingMember)) {
    redirect('/register/profile?error=legal');
  }

  const gender = String(formData.get('gender') ?? '') as 'female' | 'male' | 'other' | '';
  if (!gender) redirect('/register/profile?error=gender');

  const area = String(formData.get('area') ?? '').trim();
  if (!area) redirect('/register/profile?error=area');

  const ageBand = String(formData.get('ageBand') ?? '').trim();
  if (!ageBand) redirect('/register/profile?error=ageBand');

  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) redirect('/register?hint=auth-required');

  const identityFile = formData.get('identityDocument');
  const hasIdentityFile = identityFile instanceof File && identityFile.size > 0;

  let identityUrl: string | null = null;
  let documentUploadStatus: 'none' | 'pending' = 'none';

  if (hasIdentityFile) {
    try {
      identityUrl = await uploadDocument(identityFile, authUserId, 'identity');
      if (identityUrl) {
        documentUploadStatus = 'pending';
        const adminSupabase = createAdminSupabaseClient();
        const dbClient = adminSupabase ?? (await createServerSupabaseClient());
        if (dbClient) {
          const { data: existingIdentity } = await dbClient
            .from('identity_documents')
            .select('id')
            .eq('user_id', authUserId)
            .maybeSingle();
          if (existingIdentity?.id) {
            await dbClient
              .from('identity_documents')
              .update({ document_url: identityUrl, status: 'pending' })
              .eq('id', existingIdentity.id);
          } else {
            await dbClient.from('identity_documents').insert({
              user_id: authUserId,
              document_url: identityUrl,
              status: 'pending',
            });
          }
        }
      } else {
        console.warn('CONNECTION_IDENTITY_UPLOAD_SKIPPED', { authUserId, reason: 'empty_url' });
      }
    } catch (error) {
      console.error('CONNECTION_IDENTITY_UPLOAD_ERROR', { authUserId, error: String(error) });
      // 初回登録は本人確認書類なし・アップロード失敗でも完了させる
    }
  }

  const trustPatch: Partial<import('@/lib/connection/types').ConnectionMember> = {
    documentUploadStatus,
  };
  if (identityUrl) {
    trustPatch.trustVerificationStatus = 'pending' as TrustVerificationStatus;
    trustPatch.verificationSource = 'id_only' as VerificationSource;
    trustPatch.identityVerified = false;
    trustPatch.trustNotes = `identity:${identityUrl}`;
    trustPatch.identityVerificationMethod = 'manual_document';
  }

  const purposes = formData.getAll('purposes') as ConnectionPurpose[];
  const interestTags = formData.getAll('interestTags') as InterestTag[];
  const valueTags = formData.getAll('valueTags') as ValueTag[];
  const lifePhase = String(formData.get('lifePhase') ?? 'other') as LifePhase;

  const { AGE_BAND_TO_AGE } = await import('@/lib/connection/bloom-profile-options');
  const ageFromBand = AGE_BAND_TO_AGE[ageBand as keyof typeof AGE_BAND_TO_AGE] ?? Number(formData.get('age') ?? 0);

  // valueTags を coreValues（表示用文字列）にも反映し、既存構造との互換を維持する
  const explicitCoreValues = String(formData.get('coreValues') ?? '').trim();
  const coreValues =
    explicitCoreValues || valueTags.map((tag) => VALUE_TAG_LABEL[tag]).filter(Boolean).join('、');

  const mbtiRaw = String(formData.get('mbtiType') ?? '').trim();

  await updateMember(memberId, {
    ...trustPatch,
    nickname,
    age: ageFromBand,
    ageBand: ageBand as import('@/lib/connection/bloom-profile-options').AgeBand,
    gender,
    area,
    occupation: String(formData.get('occupation') ?? '').trim(),
    bio: String(formData.get('bio') ?? '').trim(),
    mbtiType: (mbtiRaw || '') as import('@/lib/connection/bloom-profile-options').MbtiType | '',
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

  const { SOCIAL_LINK_PLATFORMS } = await import('@/lib/connection/bloom-profile-options');
  const socialLinks = normalizeSocialLinks(
    SOCIAL_LINK_PLATFORMS.map(({ platform }) => ({
      platform,
      url: String(formData.get(`socialLink_${platform}`) ?? '').trim(),
      isVisibleOnProfile: false,
    })),
  );
  await saveMemberSocialLinks(memberId, socialLinks);

  // ステップ式ウィザードから性格診断結果も同時に届く場合は保存する（既存 temperament フロー互換）
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

  console.log('CONNECTION_PROFILE_SAVE', {
    nickname,
    ageBand,
    purposes,
    interestTags,
    valueTags,
    lifePhase,
    mbtiType: mbtiRaw,
    personalityType,
    documentUploadStatus,
    identityUploaded: Boolean(identityUrl),
  });
  await persistProfilePhotos(memberId, formData);
  revalidatePath('/register/profile');
  revalidatePath('/my-profile');
  revalidatePath('/manage');
  redirect('/register/complete');
}

export async function saveMemberPhotosAction(formData: FormData) {
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile');

  await persistProfilePhotos(memberId, formData);

  revalidatePath('/my-profile');
  revalidatePath('/events');
  revalidatePath('/posts');
  redirect('/my-profile?photos=saved');
}

export async function updateMyProfileAction(formData: FormData) {
  const nickname = String(formData.get('nickname') ?? '').trim();
  if (!nickname) redirect('/my-profile?mode=edit&error=nickname');

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile');

  const beforeMember = await getMember(memberId);

  const purposes = formData.getAll('purposes') as ConnectionPurpose[];
  const interestTags = formData.getAll('interestTags') as InterestTag[];
  const valueTags = formData.getAll('valueTags') as ValueTag[];
  const lifePhase = String(formData.get('lifePhase') ?? 'other') as LifePhase;
  const mbtiRaw = String(formData.get('mbtiType') ?? '').trim();
  const markAiIntro = formData.get('introductionAiGenerated') === '1';
  const nextBio = String(formData.get('bio') ?? '').trim();
  const area = String(formData.get('area') ?? '').trim();
  const occupation = String(formData.get('occupation') ?? '').trim();

  const explicitCoreValues = String(formData.get('coreValues') ?? '').trim();
  const coreValues =
    explicitCoreValues || valueTags.map((tag) => VALUE_TAG_LABEL[tag]).filter(Boolean).join('、');

  const beforeValues = beforeMember?.values;

  await updateMember(memberId, {
    nickname,
    age: Number(formData.get('age') ?? 0),
    gender: String(formData.get('gender') ?? 'other') as 'female' | 'male' | 'other',
    area: area || beforeMember?.area || '',
    occupation: occupation || beforeMember?.occupation || '',
    bio: nextBio,
    purposes,
    interestTags,
    lifePhase,
    mbtiType: (mbtiRaw || 'unknown') as import('@/lib/connection/bloom-profile-options').MbtiType,
    values: {
      mostImportant: String(formData.get('mostImportant') ?? beforeValues?.mostImportant ?? '').trim(),
      currentChallenge: String(formData.get('currentChallenge') ?? beforeValues?.currentChallenge ?? '').trim(),
      futureGoal: String(formData.get('futureGoal') ?? beforeValues?.futureGoal ?? '').trim(),
      recentInspiration: String(formData.get('recentInspiration') ?? beforeValues?.recentInspiration ?? '').trim(),
      howOthersSeeMe: String(formData.get('howOthersSeeMe') ?? beforeValues?.howOthersSeeMe ?? '').trim(),
      personalityOneWord: String(formData.get('personalityOneWord') ?? beforeValues?.personalityOneWord ?? '').trim(),
      coreValues,
      valueTags,
    },
    ...(markAiIntro
      ? {
          introductionAiGenerated: true,
          introductionGeneratedAt: new Date().toISOString(),
        }
      : {}),
  });

  const { SOCIAL_LINK_PLATFORMS } = await import('@/lib/connection/bloom-profile-options');
  const socialLinks = normalizeSocialLinks(
    SOCIAL_LINK_PLATFORMS.map(({ platform }) => ({
      platform,
      url: String(formData.get(`socialLink_${platform}`) ?? '').trim(),
      isVisibleOnProfile: formData.get(`socialVisible_${platform}`) === '1',
    })),
  );
  console.error('HANAKAI_SOCIAL_LINK_SAVE_PAYLOAD', {
    memberId,
    links: socialLinks
      .filter((l) => l.url.length > 0)
      .map((l) => ({
        member_id: memberId,
        platform: l.platform,
        url: l.url,
        is_visible_on_profile: l.isVisibleOnProfile,
      })),
  });
  await saveMemberSocialLinks(memberId, socialLinks);

  const temperamentValue = String(formData.get('temperament') ?? '');
  const temp = TEMPERAMENT_OPTIONS.find((t) => t.value === temperamentValue);
  if (temp) {
    await saveMemberPersonality(memberId, {
      type: temp.type,
      axes: temp.axes,
      completedAt: new Date().toISOString(),
    });
  }

  await persistProfilePhotos(memberId, formData);

  if (beforeMember) {
    const { recordProfileChangeTimeline } = await import('@/lib/connection/bloom-phase4-actions');
    await recordProfileChangeTimeline(
      memberId,
      { bio: beforeMember.bio, interestTags: beforeMember.interestTags },
      { bio: nextBio, interestTags },
    );
  }

  revalidatePath('/my-profile');
  revalidatePath('/events');
  revalidatePath('/connections');
  revalidatePath('/admin/hanakai/members');
  redirect('/my-profile?saved=1');
}

async function persistIdentityDocumentUpload(
  authUserId: string,
  identityFile: File,
): Promise<string | null> {
  const identityUrl = await uploadDocument(identityFile, authUserId, 'identity');
  if (!identityUrl) return null;

  const adminSupabase = createAdminSupabaseClient();
  const dbClient = adminSupabase ?? (await createServerSupabaseClient());
  if (dbClient) {
    const { data: existingIdentity } = await dbClient
      .from('identity_documents')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    if (existingIdentity?.id) {
      await dbClient
        .from('identity_documents')
        .update({ document_url: identityUrl, status: 'pending' })
        .eq('id', existingIdentity.id);
    } else {
      await dbClient.from('identity_documents').insert({
        user_id: authUserId,
        document_url: identityUrl,
        status: 'pending',
      });
    }
  }
  return identityUrl;
}

export async function submitIdentityDocumentAction(formData: FormData) {
  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register');

  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) redirect('/register?hint=auth-required');

  const identityFile = formData.get('identityDocument');
  if (!(identityFile instanceof File) || identityFile.size === 0) {
    redirect('/my-profile?mode=edit&error=identity');
  }

  const docCheck = await checkIdentityDocumentFileServer(identityFile);
  if (!docCheck.ok) {
    redirect('/my-profile?mode=edit&error=identity_document');
  }

  const member = await getMember(memberId);
  if (!member) redirect('/my-profile');

  let identityUrl: string | null = null;
  try {
    identityUrl = await persistIdentityDocumentUpload(authUserId, identityFile);
  } catch (error) {
    console.error('CONNECTION_IDENTITY_UPLOAD_ERROR', { authUserId, error: String(error) });
    redirect('/my-profile?mode=edit&error=identity');
  }

  if (!identityUrl) {
    redirect('/my-profile?mode=edit&error=identity');
  }

  const { IDENTITY_RESUBMIT_FLAG } = await import('@/lib/connection/identity-verification');
  const safetyFlags = member.safetyFlags.filter((flag) => flag !== IDENTITY_RESUBMIT_FLAG);

  await updateMember(memberId, {
    documentUploadStatus: 'pending',
    trustVerificationStatus: 'pending' as TrustVerificationStatus,
    verificationSource: 'id_only' as VerificationSource,
    identityVerified: false,
    trustNotes: `identity:${identityUrl}`,
    identityVerificationMethod: 'manual_document',
    safetyFlags,
  });

  revalidatePath('/my-profile');
  revalidatePath('/admin/hanakai/members');
  redirect('/my-profile?identity=submitted');
}

export async function savePersonalityAction(formData: FormData) {
  const type = String(formData.get('type') ?? '') as PersonalityType;
  const energy = String(formData.get('energy') ?? 'introvert') as 'extravert' | 'introvert';
  const thinking = String(formData.get('thinking') ?? 'feeling') as 'logic' | 'feeling';
  const planning = String(formData.get('planning') ?? 'flexible') as 'plan' | 'flexible';

  const memberId = await ensureViewerMemberId();
  if (!memberId) redirect('/register');

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
  await requireHanakaiAdminAccess('/manage');
  const memberId = String(formData.get('memberId') ?? '');
  const eventId = String(formData.get('eventId') ?? '');
  const returnPath = String(formData.get('returnPath') ?? '').trim();
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
  revalidatePath('/my-profile');
  revalidatePath(`/profile/${memberId}`);
  revalidatePath(`/admin/hanakai/members/${memberId}`);
  revalidatePath('/admin/hanakai/members');
  if (returnPath) {
    redirect(`${returnPath}?trustUpdated=1`);
  }
  redirect(`/manage?event=${eventId}&trustUpdated=${memberId}`);
}

export async function deleteHanakaiAccountAction(formData: FormData) {
  if (formData.get('confirmed') !== '1') {
    throw new Error('確認チェックが必要です');
  }

  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) {
    redirect('/login?next=/account/delete');
  }

  const memberId = await getViewerMemberId();
  if (!memberId) {
    throw new Error('会員情報が見つかりません');
  }

  const member = await getMember(memberId);
  if (isDeletedMember(member)) {
    redirect('/?account=deleted');
  }

  const reason = String(formData.get('reason') ?? '').trim();
  await deleteHanakaiAccount({ memberId, authUserId, reason: reason || null });

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect('/?account=deleted');
}
