import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { LegalLinks } from '@/components/connection/legal-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';
const REVISED_AT = '2026年7月8日';

const SECTIONS: { heading: string; body?: string; items?: string[] }[] = [
  {
    heading: 'はじめに',
    body: '本利用規約（以下「本規約」）は、HANAKAI Connection（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく前に、本規約をご確認ください。本規約はストア申請およびサービス運営を目的として作成しており、最終的な法的判断については専門家の確認を推奨します。',
  },
  {
    heading: 'サービス概要',
    body: '本サービスは、リアルな体験（イベント）を通じて、参加者同士のつながり（Connection）を育むコミュニティプラットフォームです。運営は、安全で信頼できる場づくりのため、参加承認・本人確認・通報対応等を行う場合があります。',
  },
  {
    heading: '登録条件',
    items: [
      '18歳以上であること',
      '本規約およびプライバシーポリシーに同意すること',
      '虚偽の情報を登録しないこと',
      '一人につき一つのアカウントを原則とすること（運営が認める場合を除く）',
    ],
  },
  {
    heading: '禁止行為',
    body: '利用者は、以下の行為を行ってはなりません。',
    items: [
      '法令または公序良俗に反する行為',
      '他の利用者への迷惑行為、ハラスメント、脅迫、差別的言動',
      '営業・勧誘・スパム行為',
      '虚偽のプロフィール登録、なりすまし',
      '本人確認書類の偽造・不正利用',
      '本サービスの運営を妨害する行為、不正アクセス',
      'その他、運営が不適切と判断する行為',
    ],
  },
  {
    heading: 'イベント参加ルール',
    items: [
      'イベントごとに定める集合時間・場所・参加条件に従うこと',
      '他の参加者を尊重し、節度ある態度で参加すること',
      '無断キャンセル・直前キャンセルは、今後の参加制限の対象となる場合があります',
      '参加費・キャンセル条件は各イベントの案内に従います',
    ],
  },
  {
    heading: '本人確認',
    body: '運営は、安全確認のため、本人確認書類の提出を求める場合があります。提出いただいた情報は、プライバシーポリシーに従い取り扱います。確認が完了しない場合、参加が制限されることがあります。',
  },
  {
    heading: '通報・利用停止',
    body: '利用者は、迷惑行為や安全上の懸念を運営に通報できます。運営は、通報内容の確認、参加制限、利用停止、アカウント削除等の措置を行う場合があります。措置の内容・期間は、個別の状況に応じて判断します。',
  },
  {
    heading: '免責事項',
    body: '本サービスは現状有姿で提供されます。運営は、本サービスの完全性・正確性・特定目的への適合性等について、明示または黙示を問わず保証しません。利用者間のトラブルについて、運営に故意または重過失がある場合を除き、責任を負わないものとします（法令上免責が認められない場合はこの限りではありません）。',
  },
  {
    heading: '退会',
    body: '利用者は、所定の方法によりアカウントを削除（退会）できます。ログイン後、/account/delete から手続きが可能です。退会後のデータ取扱いは、プライバシーポリシーに従います。',
  },
  {
    heading: '規約の変更',
    body: '運営は、必要に応じて本規約を変更することがあります。重要な変更がある場合は、本サービス上でお知らせします。変更後に本サービスを利用した場合、変更後の規約に同意したものとみなす場合があります。',
  },
  {
    heading: '準拠法・管轄',
    body: '本規約は日本法に準拠するものとします。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とする場合があります（法令上認められない場合はこの限りではありません）。',
  },
  {
    heading: 'お問い合わせ',
    body: '本規約に関するお問い合わせは、お問い合わせフォーム（/contact）よりご連絡ください。',
  },
];

export const metadata = {
  title: '利用規約',
  description: 'HANAKAI Connection 利用規約',
};

export default async function TermsPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='mx-auto max-w-[680px] space-y-8'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            TERMS
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            利用規約
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            HANAKAI Connectionを安心してご利用いただくための基本的なルールです。ご参加の前にご確認ください。
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
            href='/privacy'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            プライバシーポリシーを見る
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
