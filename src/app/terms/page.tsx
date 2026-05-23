import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function TermsPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>利用規約</h1>
        <p className='text-sm leading-7 text-slate-600'>
          本サービスは18歳以上のみ利用可能です。本人確認および審査のために提出された情報に虚偽があった場合、
          アカウント停止・退会処理を行う場合があります。
        </p>
        <ul className='space-y-2 text-sm text-slate-600'>
          <li>・年齢確認と本人確認は必須です。</li>
          <li>・婚姻状態を含むプロフィールの虚偽申告は禁止です。</li>
          <li>・ハラスメント行為や危険行為は禁止です。</li>
          <li>・通報内容は運営が確認し、必要に応じて警告・停止・退会措置を行います。</li>
          <li>・ブロック機能により相互非表示となる場合があります。</li>
          <li>・退会は設定画面からいつでも可能です（退会後はログアウト）。</li>
          <li>・AIを活用した登録審査および公開情報確認を行う場合があります。</li>
          <li>・運営判断で警告/停止/永久停止を行う場合があります。</li>
        </ul>
        <p className='text-xs text-slate-500'>特定商取引法表記は今後 ` /tokushoho ` で公開予定です。</p>
        <Link href='/privacy' className='inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
          プライバシーポリシーへ
        </Link>
      </section>
    </AppShell>
  );
}
