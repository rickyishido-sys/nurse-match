/** HANAKAI Connection — レスポンシブコンテナ幅（shell / nav 共用） */
export const CONNECTION_MAX_WIDTH_CLASS = 'max-w-[390px] md:max-w-[768px] lg:max-w-[1200px]';

export const CONNECTION_SHELL_CLASS = `mx-auto flex min-h-screen w-full ${CONNECTION_MAX_WIDTH_CLASS} flex-col border-x border-[#ebe9e4] bg-[#fafaf8] lg:shadow-[0_0_40px_rgba(26,26,26,0.04)]`;

export const CONNECTION_PAGE_CLASS = `mx-auto w-full ${CONNECTION_MAX_WIDTH_CLASS}`;

export const CONNECTION_HEADER_CLASS =
  'hk-header-bar sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl';

export const CONNECTION_HEADER_INNER_CLASS = 'px-5 py-4';

export const CONNECTION_NAV_CLASS = `fixed bottom-0 left-1/2 z-30 w-full ${CONNECTION_MAX_WIDTH_CLASS} -translate-x-1/2 border-t border-[#ebe9e4] bg-[#fafaf8]/95 px-[calc(0.75rem+env(safe-area-inset-left,0px))] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pr-[calc(0.75rem+env(safe-area-inset-right,0px))] pt-2 backdrop-blur`;

/** HANAKAI 運営管理コンソール（参加申請・会員・通報） */
export const HANAKAI_ADMIN_CONSOLE_HREF = '/admin/hanakai';
