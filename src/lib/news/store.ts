import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { put, head } from '@vercel/blob';
import type { NewsSnapshot } from '@/lib/news/types';
import { EMPTY_SNAPSHOT } from '@/lib/news/types';

const BLOB_PATHNAME = 'hanakai/news/snapshot.json';
const LOCAL_PATH = path.join(process.cwd(), '.data', 'news-snapshot.json');
const SEED_PATH = path.join(process.cwd(), 'src/lib/news/default-snapshot.json');

export async function saveNewsSnapshot(snapshot: NewsSnapshot): Promise<string | null> {
  const json = JSON.stringify(snapshot, null, 2);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(BLOB_PATHNAME, json, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    snapshot.blobUrl = blob.url;
    return blob.url;
  }

  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await writeFile(LOCAL_PATH, json, 'utf8');
  return null;
}

async function readJsonFile(filePath: string): Promise<NewsSnapshot | null> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as NewsSnapshot;
  } catch {
    return null;
  }
}

async function loadFromBlob(): Promise<NewsSnapshot | null> {
  const explicitUrl = process.env.NEWS_SNAPSHOT_BLOB_URL?.trim();
  if (explicitUrl) {
    const res = await fetch(explicitUrl, { next: { revalidate: 300 } });
    if (res.ok) return (await res.json()) as NewsSnapshot;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  try {
    const meta = await head(BLOB_PATHNAME);
    if (!meta?.url) return null;
    const res = await fetch(meta.url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as NewsSnapshot;
  } catch {
    return null;
  }
}

export async function loadNewsSnapshot(): Promise<NewsSnapshot> {
  const fromBlob = await loadFromBlob();
  if (fromBlob && fromBlob.articles.length > 0) return fromBlob;

  const fromLocal = await readJsonFile(LOCAL_PATH);
  if (fromLocal && fromLocal.articles.length > 0) return fromLocal;

  const fromSeed = await readJsonFile(SEED_PATH);
  if (fromSeed) return fromSeed;

  return EMPTY_SNAPSHOT;
}
