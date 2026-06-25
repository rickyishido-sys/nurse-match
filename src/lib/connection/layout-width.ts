/** HANAKAI Connection — レスポンシブコンテナ幅（shell / nav 共用） */
export const CONNECTION_MAX_WIDTH_CLASS = 'max-w-[390px] md:max-w-[768px] lg:max-w-[1200px]';

export const CONNECTION_SHELL_CLASS = `mx-auto flex min-h-screen w-full ${CONNECTION_MAX_WIDTH_CLASS} flex-col border-x border-[#ebe9e4] bg-[#fafaf8] lg:shadow-[0_0_40px_rgba(26,26,26,0.04)]`;

export const CONNECTION_PAGE_CLASS = `mx-auto w-full ${CONNECTION_MAX_WIDTH_CLASS}`;

export const CONNECTION_NAV_CLASS = `fixed bottom-0 left-1/2 z-30 w-full ${CONNECTION_MAX_WIDTH_CLASS} -translate-x-1/2 border-t border-[#ebe9e4] bg-[#fafaf8]/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur`;
