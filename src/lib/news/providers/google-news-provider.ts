import type { CategoryConfig } from '@/lib/news/categories';
import { parseRssFeed } from '@/lib/news/parse-rss';
import type { NewsArticle, NewsFetchError } from '@/lib/news/types';

const FETCH_TIMEOUT_MS = 12_000;

function googleNewsRssUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`;
}

export async function fetchGoogleNewsForCategory(
  category: CategoryConfig,
): Promise<{ articles: NewsArticle[]; errors: NewsFetchError[] }> {
  const articles: NewsArticle[] = [];
  const errors: NewsFetchError[] = [];
  const url = googleNewsRssUrl(category.googleNewsQuery);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HANAKAI-NewsBot/1.0 (+https://hanakai.kranz.design)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 0 },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRssFeed(xml, 'Google News');
    for (const item of items) {
      articles.push({
        title: item.title,
        source: item.source,
        url: item.url,
        publishedAt: item.publishedAt,
        category: category.id,
        provider: 'google-news',
        summary: item.summary || undefined,
      });
    }
  } catch (error) {
    errors.push({
      provider: 'google-news',
      category: category.id,
      feed: url,
      message: String(error),
    });
  }

  return { articles, errors };
}
