import Link from 'next/link';
import { CATEGORY_LABEL } from '@/lib/news/categories';
import { groupArticlesByCategory } from '@/lib/news/fetch-news';
import { loadNewsSnapshot } from '@/lib/news/store';
import type { NewsArticle } from '@/lib/news/types';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target='_blank'
      rel='noopener noreferrer'
      className='block rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 transition hover:border-[#1f5d4f]/30 hover:shadow-sm'
    >
      <p className='line-clamp-2 text-sm font-medium leading-6 text-[#1a1a1a]'>{article.title}</p>
      <div className='mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#9a9a9a]'>
        <span>{article.source}</span>
        <span>·</span>
        <span>{formatDate(article.publishedAt)}</span>
        <span>·</span>
        <span className='rounded-full bg-[#eef4f0] px-2 py-0.5 text-[#1f5d4f]'>{article.provider}</span>
      </div>
      {article.summary ? (
        <p className='mt-2 line-clamp-2 text-xs leading-6 text-[#6b6b6b]'>{article.summary}</p>
      ) : null}
    </a>
  );
}

export async function NewsBoard() {
  const snapshot = await loadNewsSnapshot();
  const grouped = groupArticlesByCategory(snapshot.articles);
  const hasNews = snapshot.articles.length > 0;

  return (
    <section className='bg-white px-6 py-16'>
      <div className='mx-auto w-full max-w-[1080px]'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='text-[11px] font-semibold tracking-[0.24em] text-[#1f5d4f]'>NEWS</p>
            <h2 className='mt-2 text-2xl font-semibold text-[#1a1a1a]'>今日のニュース</h2>
            <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
              RSS / Google News から取得した最新記事です。
            </p>
          </div>
          {snapshot.fetchedAt ? (
            <p className='text-xs text-[#9a9a9a]'>
              最終更新: {formatDate(snapshot.fetchedAt)}
            </p>
          ) : null}
        </div>

        {!hasNews ? (
          <div className='rounded-3xl border border-dashed border-[#ddd9d1] bg-[#faf9f6] px-6 py-10 text-center'>
            <p className='text-sm text-[#6b6b6b]'>ニュースを読み込み中です。しばらくしてから再度ご確認ください。</p>
          </div>
        ) : (
          <div className='space-y-10'>
            {(Object.keys(grouped) as Array<keyof typeof grouped>).map((category) => {
              const items = grouped[category];
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <div className='mb-4 flex items-center justify-between gap-3'>
                    <h3 className='text-lg font-semibold text-[#1a1a1a]'>{CATEGORY_LABEL[category]}</h3>
                    <span className='text-xs text-[#9a9a9a]'>{items.length}件</span>
                  </div>
                  <div className='grid gap-3 md:grid-cols-2'>
                    {items.slice(0, 12).map((article) => (
                      <ArticleCard key={`${article.url}-${article.provider}`} article={article} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className='mt-8 text-center'>
          <Link href='/admin/news' className='text-xs text-[#9a9a9a] underline-offset-2 hover:underline'>
            運営: ニュース取得状況
          </Link>
        </div>
      </div>
    </section>
  );
}
