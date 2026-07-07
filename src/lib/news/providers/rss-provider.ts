import type { CategoryConfig } from '@/lib/news/categories';
import { parseRssFeed } from '@/lib/news/parse-rss';
import type { NewsArticle, NewsFetchError } from '@/lib/news/types';

const FETCH_TIMEOUT_MS = 12_000;

async function fetchXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HANAKAI-NewsBot/1.0 (+https://hanakai.kranz.design)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRssForCategory(
  category: CategoryConfig,
): Promise<{ articles: NewsArticle[]; errors: NewsFetchError[] }> {
  const articles: NewsArticle[] = [];
  const errors: NewsFetchError[] = [];

  for (const feed of category.rssFeeds) {
    try {
      const xml = await fetchXml(feed.url);
      const items = parseRssFeed(xml, feed.source);
      for (const item of items) {
        articles.push({
          title: item.title,
          source: item.source,
          url: item.url,
          publishedAt: item.publishedAt,
          category: category.id,
          provider: 'rss',
          summary: item.summary || undefined,
        });
      }
    } catch (error) {
      errors.push({
        provider: 'rss',
        category: category.id,
        feed: feed.url,
        message: String(error),
      });
    }
  }

  return { articles, errors };
}
