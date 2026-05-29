import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { registerDatefiInterestAction } from '@/lib/actions';
import { getCurrentUser } from '@/lib/data';
import { getAccessState } from '@/lib/guard';

type DatefiPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function DatefiPage({ searchParams }: DatefiPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.gender !== 'male') redirect('/mypage');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  const params = searchParams ? await searchParams : {};
  const registered = pickFirst(params.registered) === '1';

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='space-y-3 rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm'>
          <h1 className='text-2xl font-bold text-slate-900'>運用feeを、出会いのきっかけに。</h1>
          <p className='text-sm text-slate-600'>働いたお金だけではなく、資産にも少し働いてもらう。</p>
          <p className='text-sm leading-7 text-slate-600'>
            ナースマッチでは、
            <br />
            Base上のETH/USDC運用で得られるfeeを、
            <br />
            サービス利用料や食事・お茶などの費用に活用する仕組みを検討しています。
            <br />
            <br />
            得られたfeeの範囲で使い、
            <br />
            足りない分は通常の決済を組み合わせる。
            <br />
            <br />
            無理に増やすのではなく、
            <br />
            日常を少し軽くするための仕組みです。
          </p>
        </article>

        <article className='space-y-3 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>仕組み</h2>
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
              <p className='text-xs font-semibold text-pink-600'>STEP 1</p>
              <h3 className='mt-1 font-semibold text-slate-900'>ETH/USDCを運用</h3>
              <p className='mt-2 text-sm text-slate-600'>Base上のETH/USDCペアで、一定レンジ内の流動性提供を行います。</p>
            </div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
              <p className='text-xs font-semibold text-pink-600'>STEP 2</p>
              <h3 className='mt-1 font-semibold text-slate-900'>feeを回収</h3>
              <p className='mt-2 text-sm text-slate-600'>取引が発生すると、流動性提供に応じたfeeが発生します。</p>
            </div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
              <p className='text-xs font-semibold text-pink-600'>STEP 3</p>
              <h3 className='mt-1 font-semibold text-slate-900'>出会いや食事に活用</h3>
              <p className='mt-2 text-sm text-slate-600'>得られたfeeを、ナースマッチ内の利用料や、将来的には食事・買い物などに活用する構想です。</p>
            </div>
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>関心登録</h2>
          {registered ? (
            <p className='rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700'>
              関心登録を受け付けました。準備が整い次第、メールでご案内します。
            </p>
          ) : null}
          <form action={registerDatefiInterestAction}>
            <button className='rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white'>この仕組みに興味がある</button>
          </form>
        </article>

        <article className='space-y-3 rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>ご利用前の注意</h2>
          <p className='text-sm leading-7 text-slate-700'>
            デジタル資産運用には、
            <br />
            ETH価格の変動、インパーマネントロス、手数料変動、
            <br />
            レンジ外れ、元本価値の変動などのリスクがあります。
            <br />
            <br />
            feeの発生や金額を保証するものではありません。
            <br />
            <br />
            掲載内容は仕組みの説明および利用イメージであり、
            <br />
            将来の成果を保証するものではありません。
            <br />
            <br />
            余剰資金の範囲で、
            <br />
            内容を理解したうえでご利用ください。
          </p>
        </article>

        {/* DateFi将来構想:
            - RangeCoreのETH/USDCレンジ監視ロジックを流用可能
            - Base ETH/USDC
            - ±5%レンジ
            - fee回収
            - IL確認
            - ガチホ比較
            - 自動リバランス
            - LINE通知またはアプリ内通知
        */}
        <Link href='/mypage' className='inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>
          マイページへ戻る
        </Link>
      </section>
    </AppShell>
  );
}

