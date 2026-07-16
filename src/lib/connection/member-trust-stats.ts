import type { ConnectionMember } from '@/lib/connection/types';

/** 将来DB連携用の信頼性指標（現時点はプレースホルダ表示） */
export type MemberTrustStats = {
  participationCount: number;
  hostCount: number;
  reviewScore: number | null;
  participationRate: number;
  noShowCount: number;
};

export function getMemberTrustStats(_member: ConnectionMember): MemberTrustStats {
  return {
    participationCount: 0,
    hostCount: 0,
    reviewScore: null,
    participationRate: 0,
    noShowCount: 0,
  };
}
