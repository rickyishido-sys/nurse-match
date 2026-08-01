import { memberHasProfilePhotos } from '@/lib/connection/member-photo';
import type { BloomProfile } from '@/lib/connection/bloom-profile-types';
import type { ConnectionMember } from '@/lib/connection/types';

export const PROFILE_SECTION_IDS = {
  photos: 'profile-section-photos',
  bio: 'profile-section-bio',
  interests: 'profile-section-interests',
  purposes: 'profile-section-purposes',
  values: 'profile-section-values',
  personality: 'profile-section-personality',
  sns: 'profile-section-sns',
  identity: 'profile-section-identity',
  intro: 'profile-section-intro',
  timeline: 'profile-section-timeline',
} as const;

export type ProfileCompletionItem = {
  id: string;
  label: string;
  incompleteLabel: string;
  sectionId: string;
  complete: boolean;
};

export type ProfileCompletionResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
  incompleteItems: ProfileCompletionItem[];
};

function hasValues(member: ConnectionMember): boolean {
  const v = member.values;
  return Boolean(
    v.mostImportant?.trim() ||
      v.currentChallenge?.trim() ||
      v.futureGoal?.trim() ||
      v.recentInspiration?.trim() ||
      v.personalityOneWord?.trim() ||
      v.coreValues?.trim() ||
      (v.valueTags && v.valueTags.length > 0),
  );
}

function hasSocialLinks(member: ConnectionMember): boolean {
  return member.socialLinks.some((l) => l.url.trim().length > 0);
}

import { getIdentityStatus } from '@/lib/connection/identity-verification';

export function hasIdentityProgress(member: ConnectionMember): boolean {
  const status = getIdentityStatus(member);
  return status !== 'unsubmitted';
}

export function hasGeneratedIntro(bloomProfile: BloomProfile | null | undefined): boolean {
  if (!bloomProfile) return false;
  return Boolean(
    bloomProfile.bloomSummary.trim() ||
      bloomProfile.aiIntroduction.trim() ||
      bloomProfile.conversationStarters.length > 0 ||
      bloomProfile.aiTags.length > 0,
  );
}

export function computeProfileCompletion(
  member: ConnectionMember,
  bloomProfile: BloomProfile | null | undefined,
): ProfileCompletionResult {
  const items: ProfileCompletionItem[] = [
    {
      id: 'photos',
      label: 'プロフィール写真',
      incompleteLabel: 'プロフィール写真を登録する',
      sectionId: PROFILE_SECTION_IDS.photos,
      complete: memberHasProfilePhotos(member),
    },
    {
      id: 'bio',
      label: '自己紹介',
      incompleteLabel: '自己紹介を書く',
      sectionId: PROFILE_SECTION_IDS.bio,
      complete: Boolean(member.bio.trim()),
    },
    {
      id: 'interests',
      label: '興味・関心',
      incompleteLabel: '興味・関心を追加する',
      sectionId: PROFILE_SECTION_IDS.interests,
      complete: member.interestTags.length > 0,
    },
    {
      id: 'purposes',
      label: '参加の目的',
      incompleteLabel: '参加の目的を選ぶ',
      sectionId: PROFILE_SECTION_IDS.purposes,
      complete: member.purposes.length > 0,
    },
    {
      id: 'values',
      label: '価値観',
      incompleteLabel: '価値観を登録する',
      sectionId: PROFILE_SECTION_IDS.values,
      complete: hasValues(member),
    },
    {
      id: 'personality',
      label: '性格タイプ',
      incompleteLabel: '性格タイプを選ぶ',
      sectionId: PROFILE_SECTION_IDS.personality,
      complete: Boolean(member.personality),
    },
    {
      id: 'sns',
      label: 'SNS',
      incompleteLabel: 'SNSを登録する',
      sectionId: PROFILE_SECTION_IDS.sns,
      complete: hasSocialLinks(member),
    },
    {
      id: 'identity',
      label: '本人確認',
      incompleteLabel: '本人確認を行う',
      sectionId: PROFILE_SECTION_IDS.identity,
      complete: hasIdentityProgress(member),
    },
    {
      id: 'intro',
      label: '紹介文',
      incompleteLabel: '紹介文を作成する',
      sectionId: PROFILE_SECTION_IDS.intro,
      complete: hasGeneratedIntro(bloomProfile),
    },
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    percent,
    completedCount,
    totalCount,
    items,
    incompleteItems: items.filter((i) => !i.complete),
  };
}

export type ProfileNextRecommendation = {
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  priority: number;
};

export function resolveProfileNextRecommendation(input: {
  member: ConnectionMember;
  bloomProfile: BloomProfile | null | undefined;
  hasEventParticipation: boolean;
}): ProfileNextRecommendation {
  const { member, bloomProfile, hasEventParticipation } = input;
  const candidates: ProfileNextRecommendation[] = [];

  if (!memberHasProfilePhotos(member)) {
    candidates.push({
      priority: 1,
      title: 'プロフィール写真を登録しましょう',
      body: '顔が分かる写真があると、当日に自然と話しかけやすくなります。',
      ctaLabel: '写真を登録する',
      href: '/my-profile?mode=edit#profile-section-photos',
    });
  }

  if (!hasIdentityProgress(member)) {
    candidates.push({
      priority: 2,
      title: '本人確認を完了しましょう',
      body: '本人確認が済むと、イベントへの参加申込・作成が可能になります。本人確認はHANAKAI運営が行います。',
      ctaLabel: '本人確認へ進む',
      href: '/my-profile?mode=edit#profile-section-identity',
    });
  }

  if (!hasGeneratedIntro(bloomProfile)) {
    candidates.push({
      priority: 3,
      title: 'あなたらしさを整理してみましょう',
      body: 'プロフィールをもとに、紹介文や話しかけるきっかけを整えられます。',
      ctaLabel: 'あなたらしさを整理する',
      href: `#${PROFILE_SECTION_IDS.intro}`,
    });
  }

  if (!hasEventParticipation) {
    candidates.push({
      priority: 4,
      title: 'イベントを探してみましょう',
      body: '気になる体験を見つけて、最初の一歩を踏み出してみませんか。',
      ctaLabel: 'イベントを見る',
      href: '/events',
    });
  }

  if (candidates.length === 0) {
    return {
      priority: 99,
      title: 'プロフィールが整いました',
      body: 'あなたらしいプロフィールが育っています。次の体験を楽しみにしています。',
      ctaLabel: 'イベントを見る',
      href: '/events',
    };
  }

  return candidates.sort((a, b) => a.priority - b.priority)[0];
}
