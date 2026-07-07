import type { ConnectionMember } from '@/lib/connection/types';

export type HanakaiMemberStatus = 'active' | 'deleted';

export const WITHDRAWN_MEMBER_LABEL = '退会済みユーザー';

export function isDeletedMember(
  member: Pick<ConnectionMember, 'status'> | null | undefined,
): boolean {
  return member?.status === 'deleted';
}

/** 公開表示向け — 退会済み会員の個人情報をマスク */
export function toPublicMemberView(member: ConnectionMember): ConnectionMember {
  if (!isDeletedMember(member)) return member;
  return {
    ...member,
    nickname: WITHDRAWN_MEMBER_LABEL,
    bio: '',
    avatarUrl: '',
    photos: [],
    socialLinks: [],
    occupation: '',
    area: '',
    purposes: [],
    interestTags: [],
    values: {
      ...member.values,
      mostImportant: '',
      currentChallenge: '',
      futureGoal: '',
      recentInspiration: '',
      howOthersSeeMe: '',
      personalityOneWord: '',
      coreValues: '',
      valueTags: [],
    },
  };
}
