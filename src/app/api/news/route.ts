import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news/fetch-news';
import { loadNewsSnapshot, saveNewsSnapshot } from '@/lib/news/store';

export async function GET() {
  const snapshot = await loadNewsSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await fetchAllNews();
    const blobUrl = await saveNewsSnapshot(snapshot);
    return NextResponse.json({ ok: true, blobUrl, stats: snapshot.stats, fetchedAt: snapshot.fetchedAt });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
