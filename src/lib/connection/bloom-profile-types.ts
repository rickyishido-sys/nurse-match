export type BloomProfile = {
  memberId: string;
  aiIntroduction: string;
  bloomSummaryTitle: string;
  bloomSummary: string;
  conversationStarters: string[];
  connectionStyle: string;
  talkTopics: string[];
  aiTags: string[];
  showAiIntro: boolean;
  showBloomSummary: boolean;
  showConversationStarters: boolean;
  showBloomTags: boolean;
  showConnectionStyle: boolean;
  generatedAt: string | null;
  updatedAt: string | null;
};

export const EMPTY_BLOOM_PROFILE = (memberId: string): BloomProfile => ({
  memberId,
  aiIntroduction: '',
  bloomSummaryTitle: '',
  bloomSummary: '',
  conversationStarters: [],
  connectionStyle: '',
  talkTopics: [],
  aiTags: [],
  showAiIntro: false,
  showBloomSummary: true,
  showConversationStarters: true,
  showBloomTags: false,
  showConnectionStyle: true,
  generatedAt: null,
  updatedAt: null,
});

export type BloomProfileGenerated = {
  aiIntroduction: string;
  bloomSummaryTitle: string;
  bloomSummary: string;
  conversationStarters: string[];
  connectionStyle: string;
  talkTopics: string[];
  aiTags: string[];
};

export type PublicBloomProfile = {
  aiIntroduction?: string;
  bloomSummaryTitle?: string;
  bloomSummary?: string;
  conversationStarters?: string[];
  connectionStyle?: string;
  talkTopics?: string[];
  aiTags?: string[];
};

/** 公開プロフィール向けに可視設定を適用 */
export function toPublicBloomProfile(
  profile: BloomProfile | null,
  isOwner: boolean,
): PublicBloomProfile | null {
  if (!profile) return null;
  const hasContent =
    profile.aiIntroduction.trim() ||
    profile.bloomSummary.trim() ||
    profile.conversationStarters.length > 0 ||
    profile.connectionStyle.trim() ||
    profile.talkTopics.length > 0 ||
    profile.aiTags.length > 0;
  if (!hasContent) return null;

  const out: PublicBloomProfile = {};

  if (isOwner || profile.showAiIntro) {
    if (profile.aiIntroduction.trim()) out.aiIntroduction = profile.aiIntroduction;
  }
  if (isOwner || profile.showBloomSummary) {
    if (profile.bloomSummaryTitle.trim()) out.bloomSummaryTitle = profile.bloomSummaryTitle;
    if (profile.bloomSummary.trim()) out.bloomSummary = profile.bloomSummary;
  }
  if (isOwner || profile.showConversationStarters) {
    if (profile.conversationStarters.length > 0) out.conversationStarters = profile.conversationStarters;
  }
  if (isOwner || profile.showConnectionStyle) {
    if (profile.connectionStyle.trim()) out.connectionStyle = profile.connectionStyle;
  }
  if (isOwner || profile.showBloomTags) {
    if (profile.aiTags.length > 0) out.aiTags = profile.aiTags;
  }
  if (isOwner) {
    if (profile.talkTopics.length > 0) out.talkTopics = profile.talkTopics;
  }

  const hasVisible = Object.keys(out).length > 0;
  return hasVisible ? out : null;
}
