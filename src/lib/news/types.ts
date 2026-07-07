export type NewsCategory =
  | 'economy'
  | 'corporate'
  | 'tech'
  | 'politics'
  | 'international'
  | 'entertainment'
  | 'sports';

export type NewsProvider = 'rss' | 'google-news' | 'newsapi';

export type NewsArticle = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  provider: NewsProvider;
  summary?: string;
};

export type NewsFetchError = {
  provider: NewsProvider | 'system';
  category?: NewsCategory;
  feed?: string;
  message: string;
};

export type NewsSnapshot = {
  fetchedAt: string;
  articles: NewsArticle[];
  stats: {
    total: number;
    byProvider: Record<NewsProvider, number>;
    byCategory: Record<NewsCategory, number>;
    errors: NewsFetchError[];
  };
  blobUrl?: string | null;
};

export const EMPTY_SNAPSHOT: NewsSnapshot = {
  fetchedAt: new Date(0).toISOString(),
  articles: [],
  stats: {
    total: 0,
    byProvider: { rss: 0, 'google-news': 0, newsapi: 0 },
    byCategory: {
      economy: 0,
      corporate: 0,
      tech: 0,
      politics: 0,
      international: 0,
      entertainment: 0,
      sports: 0,
    },
    errors: [],
  },
};
