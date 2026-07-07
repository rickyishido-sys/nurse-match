import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchAllNews } from '../src/lib/news/fetch-news';

async function main() {
  const snapshot = await fetchAllNews();
  const outPath = path.join(process.cwd(), 'src/lib/news/default-snapshot.json');
  await writeFile(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log('NEWS_SEED_WRITTEN', {
    total: snapshot.stats.total,
    byCategory: snapshot.stats.byCategory,
    byProvider: snapshot.stats.byProvider,
    errors: snapshot.stats.errors.length,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
