import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { LegalLinks } from '@/components/connection/legal-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';
const REVISED_AT = '2026年8月30日';

const SECTIONS: { heading: string; body?: string; items?: string[] }[] = [
  {
    heading: 'はじめに',
    body: 'HANAKAI Connection（以下「本サービス」）は、体験を通じて人と人のつながりを育むコミュニティサービスです。本プライバシーポリシーは、本サービスにおける個人情報等の取扱いについて定めるものです。本ポリシーは、ストア申請および法令遵守を目的として作成しており、最終的な法的判断については専門家の確認を推奨します。',
  },
  {
    heading: '取得する情報',
    body: '本サービスでは、以下の情報を、サービス提供に必要な範囲で取得する場合があります。',
    items: [
      'メールアドレス（会員登録・ログイン・お問い合わせ対応のため）',
      'プロフィール情報（ニックネーム、年代、居住エリア、価値観、興味関心、自己紹介、写真など）',
      'SNS URL（プロフィールに任意で登録いただくリンク）',
      '本人確認書類（安全管理のため。イベントへの参加申請・主催など、一部機能の利用前に本人確認が必要な場合があります）',
      'イベント申込情報（参加希望、申請理由、参加履歴など）',
      '決済関連情報（参加確定時の HANAKAI 利用料の決済に必要な範囲。カード情報は決済事業者側で処理され、本サービスではカード番号そのものは保持しません）',
      '端末情報・ログ情報（アクセス日時、IPアドレス、ブラウザ種別、エラーログなど）',
      '通報・ブロック等の安全管理に関する記録',
    ],
  },
  {
    heading: '利用目的',
    body: '取得した情報は、以下の目的の範囲内で利用します。',
    items: [
      '会員登録およびアカウント管理',
      '本人確認および安全確認',
      'イベントの企画・運営・参加管理',
      '参加確定時の利用料決済および関連する請求・不正防止',
      'Connection設計（より良い出会いの組み合わせの検討）',
      '安全管理（迷惑行為・ハラスメント等への対応、通報・ブロック対応）',
      'お問い合わせ対応',
      'サービス改善および不具合対応',
    ],
  },
  {
    heading: '第三者提供',
    body: 'ご本人の同意がある場合、または法令に基づき開示が求められた場合を除き、取得した情報を権限のない第三者へ開示・提供することはありません。ただし、人命や身体の安全を保護するために必要と判断される場合など、やむを得ない事由があるときは、この限りではありません。',
  },
  {
    heading: '外部サービスの利用',
    body: '本サービスは、以下の外部サービスを利用しています。各サービスのプライバシーポリシーもあわせてご確認ください。',
    items: [
      'Supabase（認証・データベース基盤）',
      'Vercel（ホスティング・配信基盤）',
      'Square（リアルイベント参加に伴う HANAKAI 利用料の決済処理。カード情報は Square 側でトークン化され、本サービスではカード番号そのものは保持しません）',
      'OpenAI（自己紹介文の下書き生成など、AI機能を利用する場合）',
    ],
  },
  {
    heading: '保管期間・削除',
    body: '退会（アカウント削除）はアプリ内の /account/delete から手続きできます。削除手続きが完了すると、認証アカウント（ログイン用の認証情報）は削除され、公開表示上のプロフィール情報は利用できない状態になります。関連するサービスデータは削除または匿名化されます。',
    items: [
      'アカウント削除は /account/delete から開始・完了できます（ログインが必要です）',
      '決済・不正防止・通報対応・法令順守のため、取引記録や安全管理に関する記録の一部を、必要な期間保持する場合があります',
      '保持する記録には、可能な範囲で個人を特定しにくい形での保存が含まれる場合があります',
    ],
  },
  {
    heading: 'お問い合わせ窓口',
    body: '本ポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。',
    items: [
      'お問い合わせフォーム: /contact',
      'アカウント削除に関するご相談も同フォームで受け付けます',
    ],
  },
  {
    heading: '改定',
    body: `本ポリシーは、必要に応じて改定されることがあります。重要な変更がある場合は、本サービス上でお知らせします。最終改定日: ${REVISED_AT}`,
  },
];

export const metadata = {
  title: 'プライバシーポリシー',
  description: 'HANAKAI Connection プライバシーポリシー',
};

export default async function PrivacyPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='mx-auto max-w-[680px] space-y-8'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            PRIVACY
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            プライバシーポリシー
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            本サービスは、あなたのプライバシーを尊重し、信頼できる体験のために情報を丁寧に取り扱います。
          </p>
          <p className='text-xs text-[#9a9a9a]'>最終改定日: {REVISED_AT}</p>
        </div>

        <div className='space-y-4'>
          {SECTIONS.map((section) => (
            <section
              key={section.heading}
              className='space-y-3 rounded-3xl border border-[#ebe5dc] bg-white p-6 shadow-[0_2px_12px_rgba(26,26,26,0.04)]'
            >
              <h2 className='text-base font-semibold text-[#1a1a1a]'>{section.heading}</h2>
              {section.body ? <p className='text-sm leading-7 text-[#5a5247]'>{section.body}</p> : null}
              {section.items ? (
                <ul className='space-y-2 text-sm leading-7 text-[#6b6b6b]'>
                  {section.items.map((item) => (
                    <li key={item} className='flex gap-2'>
                      <span style={{ color: GOLD }}>・</span>
                      <span className='min-w-0'>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <LegalLinks className='text-[#6b6b6b]' />

        <div className='flex flex-wrap gap-3'>
          <Link
            href='/terms'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            利用規約を見る
          </Link>
          <Link
            href='/contact'
            className='inline-flex h-11 items-center justify-center rounded-full border border-[#d8d6d1] px-6 text-sm font-medium text-[#6b6b6b] transition active:scale-[0.98]'
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
