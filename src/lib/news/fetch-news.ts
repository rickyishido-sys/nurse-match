import { NEWS_CATEGORIES } from '@/lib/news/categories';
import { fetchGoogleNewsForCategory } from '@/lib/news/providers/google-news-provider';
import { fetchNewsApiForCategory } from '@/lib/news/providers/newsapi-provider';
import { fetchRssForCategory } from '@/lib/news/providers/rss-provider';
import type { NewsArticle, NewsCategory, NewsFetchError, NewsProvider, NewsSnapshot } from '@/lib/news/types';
import { EMPTY_SNAPSHOT } from '@/lib/news/types';

function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const out: NewsArticle[] = [];
  for (const article of articles) {
    const key = article.url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(article);
  }
  return out;
}

function sortByDate(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function buildStats(articles: NewsArticle[], errors: NewsFetchError[]): NewsSnapshot['stats'] {
  const byProvider: Record<NewsProvider, number> = { rss: 0, 'google-news': 0, newsapi: 0 };
  const byCategory = { ...EMPTY_SNAPSHOT.stats.byCategory };

  for (const article of articles) {
    byProvider[article.provider] += 1;
    byCategory[article.category] += 1;
  }

  return {
    total: articles.length,
    byProvider,
    byCategory,
    errors,
  };
}

/** RSS → Google News → NewsAPI の順で取得し、AI処理なしで保存用スナップショットを組み立てる */
export async function fetchAllNews(): Promise<NewsSnapshot> {
  const allArticles: NewsArticle[] = [];
  const allErrors: NewsFetchError[] = [];

  for (const category of NEWS_CATEGORIES) {
    const bucket: NewsArticle[] = [];

    const rss = await fetchRssForCategory(category);
    bucket.push(...rss.articles);
    allErrors.push(...rss.errors);

    if (bucket.length < category.maxArticles) {
      const google = await fetchGoogleNewsForCategory(category);
      bucket.push(...google.articles);
      allErrors.push(...google.errors);
    }

    if (bucket.length < category.maxArticles) {
      const newsapi = await fetchNewsApiForCategory(category);
      bucket.push(...newsapi.articles);
      allErrors.push(...newsapi.errors);
    }

    const unique = dedupeArticles(sortByDate(bucket)).slice(0, category.maxArticles);
    allArticles.push(...unique);
  }

  const articles = dedupeArticles(sortByDate(allArticles));

  return {
    fetchedAt: new Date().toISOString(),
    articles,
    stats: buildStats(articles, allErrors),
  };
}

export function groupArticlesByCategory(articles: NewsArticle[]): Record<NewsCategory, NewsArticle[]> {
  const grouped = { ...EMPTY_SNAPSHOT.stats.byCategory };
  const result = Object.fromEntries(
    (Object.keys(grouped) as NewsCategory[]).map((key) => [key, [] as NewsArticle[]]),
  ) as Record<NewsCategory, NewsArticle[]>;

  for (const article of articles) {
    result[article.category].push(article);
  }
  return result;
}
