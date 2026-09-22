export const HANAKAI_ADMIN_TOP_PATH = '/admin';
export const HANAKAI_ADMIN_DASHBOARD_PATH = '/admin/hanakai';

export type HanakaiAdminFeatureLink = {
  href: string;
  navLabel: string;
  title: string;
  description: string;
  exact?: boolean;
};

/** 実装済みの HANAKAI 運営機能のみ。未実装の入口は置かない。 */
export const HANAKAI_ADMIN_FEATURE_LINKS: HanakaiAdminFeatureLink[] = [
  {
    href: HANAKAI_ADMIN_DASHBOARD_PATH,
    navLabel: 'ダッシュボード',
    title: '運営ダッシュボード',
    description: '会員数・イベント・参加申請などの運営概況を確認します。',
    exact: true,
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/identity-reviews`,
    navLabel: '本人確認',
    title: '本人確認の審査',
    description: '提出された本人確認書類を承認・差戻しします。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/reports`,
    navLabel: '通報管理',
    title: '通報管理',
    description: '通報の確認と対応状況を管理します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/members`,
    navLabel: '会員',
    title: '会員',
    description: '会員一覧と会員詳細を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/events`,
    navLabel: 'イベント',
    title: 'イベント',
    description: '公開イベントと募集設定を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/applications`,
    navLabel: '参加申請',
    title: '参加申請',
    description: '参加申請の状況を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/revenue-reports`,
    navLabel: '売上報告',
    title: '売上報告',
    description: '主催者からの売上報告を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/invoices`,
    navLabel: '請求管理',
    title: '請求管理',
    description: '請求の発行状況を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/payments`,
    navLabel: '参加費決済',
    title: '参加費決済',
    description: '参加費の決済状況を確認します。',
  },
  {
    href: `${HANAKAI_ADMIN_DASHBOARD_PATH}/inquiries`,
    navLabel: 'お問い合わせ',
    title: 'お問い合わせ',
    description: '利用者からのお問い合わせを確認します。',
  },
  {
    href: '/manage',
    navLabel: '参加者選定',
    title: '参加者選定',
    description: 'イベントごとの参加者選定を行います。',
  },
];
