import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { LegalLinks } from '@/components/connection/legal-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export const metadata = {
  title: '特定商取引法に基づく表記',
  description: 'HANAKAI Connection の特定商取引法に基づく表記',
};

export default async function TokushohoPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <article className='mx-auto max-w-[640px] space-y-8 pb-12'>
        <header className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>LEGAL</p>
          <h1 className='text-2xl font-semibold text-[#1a1a1a]'>特定商取引法に基づく表記</h1>
        </header>

        <dl className='space-y-5 text-sm leading-7 text-[#4a4a4a]'>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>販売事業者</dt>
            <dd>RePowera株式会社</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>運営責任者</dt>
            <dd>お問い合わせフォームよりご連絡ください</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>所在地</dt>
            <dd>お問い合わせいただいた方に遅滞なく開示いたします</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>お問い合わせ</dt>
            <dd>
              <Link href='/contact' className='text-[#1f5d4f] underline-offset-2 hover:underline'>
                お問い合わせフォーム
              </Link>
            </dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>販売価格</dt>
            <dd>イベントごとに表示（アプリ内課金なし。参加費は現地払いまたは個別案内）</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>支払方法・時期</dt>
            <dd>イベント当日または主催者・運営の案内に従います（アプリ内決済はありません）</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>サービス提供時期</dt>
            <dd>各イベントの開催日時に提供</dd>
          </div>
          <div>
            <dt className='font-semibold text-[#1a1a1a]'>返品・キャンセル</dt>
            <dd>イベント参加のキャンセルはアプリ内またはお問い合わせにて。イベント内容により返金可否は個別にご案内します。</dd>
          </div>
        </dl>

        <p className='text-xs text-[#9a9a9a]'>
          ※ 表記内容の最終確認は法務・運営責任者の承認が必要です。正式情報と異なる場合は
          <Link href='/contact' className='underline'>お問い合わせ</Link>ください。
        </p>

        <LegalLinks />
      </article>
    </ConnectionShell>
  );
}
