import type { CategoryConfig } from '@/lib/news/categories';
import type { NewsArticle, NewsFetchError } from '@/lib/news/types';

const FETCH_TIMEOUT_MS = 12_000;

type NewsApiArticle = {
  title?: string;
  url?: string;
  publishedAt?: string;
  description?: string;
  source?: { name?: string };
};

export function isNewsApiEnabled(): boolean {
  return Boolean(process.env.NEWS_API_KEY?.trim());
}

export async function fetchNewsApiForCategory(
  category: CategoryConfig,
): Promise<{ articles: NewsArticle[]; errors: NewsFetchError[] }> {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  if (!apiKey) return { articles: [], errors: [] };

  const articles: NewsArticle[] = [];
  const errors: NewsFetchError[] = [];
  const params = new URLSearchParams({
    q: category.newsApiQuery,
    language: 'ja',
    sortBy: 'publishedAt',
    pageSize: String(category.maxArticles),
    apiKey,
  });
  const url = `https://newsapi.org/v2/everything?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { articles?: NewsApiArticle[]; message?: string };
    if (!data.articles) throw new Error(data.message ?? 'NewsAPI response missing articles');

    for (const item of data.articles) {
      if (!item.title || !item.url) continue;
      articles.push({
        title: item.title,
        source: item.source?.name ?? 'NewsAPI',
        url: item.url,
        publishedAt: item.publishedAt ?? new Date().toISOString(),
        category: category.id,
        provider: 'newsapi',
        summary: item.description || undefined,
      });
    }
  } catch (error) {
    errors.push({
      provider: 'newsapi',
      category: category.id,
      feed: url.replace(apiKey, '***'),
      message: String(error),
    });
  }

  return { articles, errors };
}
