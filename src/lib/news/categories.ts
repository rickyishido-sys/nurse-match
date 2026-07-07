import type { NewsCategory } from '@/lib/news/types';

export type CategoryConfig = {
  id: NewsCategory;
  label: string;
  /** 直接 RSS フィード */
  rssFeeds: { url: string; source: string }[];
  /** Google News RSS 検索クエリ */
  googleNewsQuery: string;
  /** NewsAPI 検索クエリ（任意） */
  newsApiQuery: string;
  maxArticles: number;
};

export const NEWS_CATEGORIES: CategoryConfig[] = [
  {
    id: 'economy',
    label: '経済',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat5.xml', source: 'NHK' }],
    googleNewsQuery: '経済',
    newsApiQuery: 'economy Japan',
    maxArticles: 20,
  },
  {
    id: 'corporate',
    label: '企業 / IR',
    rssFeeds: [],
    googleNewsQuery: '企業 IR 決算',
    newsApiQuery: 'corporate earnings Japan',
    maxArticles: 20,
  },
  {
    id: 'tech',
    label: 'AI / テクノロジー',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat3.xml', source: 'NHK' }],
    googleNewsQuery: 'AI テクノロジー',
    newsApiQuery: 'artificial intelligence technology',
    maxArticles: 20,
  },
  {
    id: 'politics',
    label: '政治',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat4.xml', source: 'NHK' }],
    googleNewsQuery: '政治',
    newsApiQuery: 'politics Japan',
    maxArticles: 20,
  },
  {
    id: 'international',
    label: '国際',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat6.xml', source: 'NHK' }],
    googleNewsQuery: '国際',
    newsApiQuery: 'world news',
    maxArticles: 20,
  },
  {
    id: 'entertainment',
    label: '芸能',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat2.xml', source: 'NHK' }],
    googleNewsQuery: '芸能 エンタメ',
    newsApiQuery: 'entertainment Japan',
    maxArticles: 20,
  },
  {
    id: 'sports',
    label: 'スポーツ',
    rssFeeds: [{ url: 'https://www3.nhk.or.jp/rss/news/cat7.xml', source: 'NHK' }],
    googleNewsQuery: 'スポーツ',
    newsApiQuery: 'sports Japan',
    maxArticles: 20,
  },
];

export const CATEGORY_LABEL: Record<NewsCategory, string> = Object.fromEntries(
  NEWS_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<NewsCategory, string>;
