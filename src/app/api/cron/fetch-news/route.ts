import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news/fetch-news';
import { saveNewsSnapshot } from '@/lib/news/store';

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${cronSecret}`) return true;
  }
  if (request.headers.get('x-vercel-cron')) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    console.log('NEWS_FETCH_CRON_START');
    const snapshot = await fetchAllNews();
    const blobUrl = await saveNewsSnapshot(snapshot);
    console.log('NEWS_FETCH_CRON_DONE', {
      total: snapshot.stats.total,
      byProvider: snapshot.stats.byProvider,
      errors: snapshot.stats.errors.length,
      blobUrl,
    });
    return NextResponse.json({
      ok: true,
      fetchedAt: snapshot.fetchedAt,
      total: snapshot.stats.total,
      byProvider: snapshot.stats.byProvider,
      byCategory: snapshot.stats.byCategory,
      errors: snapshot.stats.errors,
      blobUrl,
    });
  } catch (error) {
    console.error('NEWS_FETCH_CRON_ERROR', { message: String(error) });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
