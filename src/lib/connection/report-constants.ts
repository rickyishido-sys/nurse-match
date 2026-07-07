export type ReportTargetType = 'member' | 'event' | 'profile' | 'message_future' | 'other';

export type ReportCategory =
  | 'harassment'
  | 'sexual'
  | 'solicitation'
  | 'spam'
  | 'fake_profile'
  | 'dangerous_behavior'
  | 'inappropriate_content'
  | 'other';

export type ReportStatus = 'new' | 'reviewing' | 'resolved' | 'dismissed';

export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'harassment', label: '嫌がらせ・ハラスメント' },
  { value: 'sexual', label: '性的な不適切行為' },
  { value: 'solicitation', label: '勧誘・営業' },
  { value: 'spam', label: 'スパム・迷惑行為' },
  { value: 'fake_profile', label: 'なりすまし・虚偽プロフィール' },
  { value: 'dangerous_behavior', label: '危険な行為・脅迫' },
  { value: 'inappropriate_content', label: '不適切なコンテンツ' },
  { value: 'other', label: 'その他' },
];

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = Object.fromEntries(
  REPORT_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ReportCategory, string>;

export const REPORT_TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  member: 'ユーザー',
  event: 'イベント',
  profile: 'プロフィール',
  message_future: 'メッセージ',
  other: 'その他',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  new: '未対応',
  reviewing: '確認中',
  resolved: '対応済み',
  dismissed: '却下',
};
