import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_LABEL } from '@/lib/news/categories';
import { isNewsApiEnabled } from '@/lib/news/providers/newsapi-provider';
import { loadNewsSnapshot } from '@/lib/news/store';
import { refreshNewsAction } from '@/lib/news/actions';
import { getCurrentUser } from '@/lib/data';

export const metadata = {
  title: 'ニュース取得状況',
  robots: { index: false, follow: false },
};

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
      <p className='text-[11px] text-[#6b6b6b]'>{label}</p>
      <p className='mt-1 text-2xl font-bold text-[#1a1a1a]'>{value}</p>
    </article>
  );
}

export default async function AdminNewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'super_admin') redirect('/home');

  const snapshot = await loadNewsSnapshot();

  return (
    <main className='min-h-screen bg-[#f7f5f0] px-5 py-8'>
      <div className='mx-auto w-full max-w-[1080px] space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-[11px] font-semibold tracking-[0.2em] text-[#1f5d4f]'>ADMIN</p>
            <h1 className='text-xl font-semibold text-[#1a1a1a]'>ニュース取得状況</h1>
            <p className='mt-1 text-sm text-[#6b6b6b]'>RSS / Google News / NewsAPI の取得メトリクス</p>
          </div>
          <div className='flex gap-2'>
            <Link href='/admin' className='rounded-full border border-[#e2ddd2] bg-white px-4 py-2 text-xs font-medium text-[#6b6b6b]'>
              管理トップ
            </Link>
            <form action={refreshNewsAction}>
              <button
                type='submit'
                className='rounded-full bg-[#1f5d4f] px-4 py-2 text-xs font-semibold text-white'
              >
                今すぐ再取得
              </button>
            </form>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard label='合計件数' value={snapshot.stats.total} />
          <KpiCard
            label='最終更新'
            value={snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toLocaleString('ja-JP') : '未取得'}
          />
          <KpiCard label='取得エラー' value={snapshot.stats.errors.length} />
          <KpiCard label='NewsAPI' value={isNewsApiEnabled() ? '有効' : '未設定'} />
        </div>

        <section className='rounded-3xl border border-[#ebe7dd] bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>Provider別取得件数</h2>
          <div className='grid gap-2 sm:grid-cols-3'>
            <p className='text-sm text-[#4a4a4a]'>RSS: {snapshot.stats.byProvider.rss}</p>
            <p className='text-sm text-[#4a4a4a]'>Google News: {snapshot.stats.byProvider['google-news']}</p>
            <p className='text-sm text-[#4a4a4a]'>NewsAPI: {snapshot.stats.byProvider.newsapi}</p>
          </div>
        </section>

        <section className='rounded-3xl border border-[#ebe7dd] bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>カテゴリ別件数</h2>
          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {(Object.keys(snapshot.stats.byCategory) as Array<keyof typeof snapshot.stats.byCategory>).map((key) => (
              <p key={key} className='text-sm text-[#4a4a4a]'>
                {CATEGORY_LABEL[key]}: {snapshot.stats.byCategory[key]}
              </p>
            ))}
          </div>
        </section>

        <section className='rounded-3xl border border-[#ebe7dd] bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>取得エラー</h2>
          {snapshot.stats.errors.length === 0 ? (
            <p className='text-sm text-[#6b6b6b]'>エラーはありません。</p>
          ) : (
            <ul className='space-y-2'>
              {snapshot.stats.errors.map((err, idx) => (
                <li key={`${err.provider}-${idx}`} className='rounded-2xl bg-[#faf9f6] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
                  <span className='font-semibold text-[#c0526b]'>{err.provider}</span>
                  {err.category ? ` / ${CATEGORY_LABEL[err.category]}` : ''}
                  {err.feed ? ` / ${err.feed}` : ''}
                  <br />
                  {err.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
