import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { LegalLinks } from '@/components/connection/legal-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';
const REVISED_AT = '2026年8月7日';

const SECTIONS: { heading: string; body?: string; items?: string[] }[] = [
  {
    heading: 'HANAKAIが大切にすること',
    body: 'HANAKAI Connection は、リアルなイベントを通じて、初対面の人同士が安心してつながるためのコミュニティです。誰もが気持ちよく参加できるよう、以下のガイドラインを守ってご利用ください。',
  },
  {
    heading: '相手を尊重する',
    items: [
      'はじめて会う相手にも、礼儀と思いやりを持って接してください',
      '価値観や背景の違いを認め合い、対等な立場で交流してください',
      '相手が不快に感じる言動は控えてください',
    ],
  },
  {
    heading: '迷惑行為・ハラスメントの禁止',
    body: '以下の行為は禁止です。確認された場合、参加制限・利用停止・アカウント削除の対象となります。',
    items: [
      '誹謗中傷、脅迫、差別的言動、つきまとい',
      '性的・暴力的な発言や、相手が望まない接触の要求',
      'しつこい連絡先の要求や、SNS・外部サービスへの執拗な誘導',
      '他の参加者やイベントの進行を妨げる行為',
    ],
  },
  {
    heading: '勧誘・営業目的での利用禁止',
    items: [
      '営業、宗教、ネットワークビジネス、投資・副業などの勧誘は禁止です',
      'イベントやプロフィールを商用の集客・宣伝に利用しないでください',
    ],
  },
  {
    heading: '虚偽プロフィール・なりすましの禁止',
    items: [
      '事実と異なるプロフィールの登録や、他人になりすます行為は禁止です',
      '本人確認は全ユーザー必須です。虚偽の書類提出や不正利用は禁止です',
    ],
  },
  {
    heading: 'イベント参加のマナー',
    items: [
      '参加が決まったイベントには、責任を持って参加してください',
      '無断欠席・直前キャンセルは、他の参加者や主催者に迷惑がかかります。やむを得ない場合は早めに連絡してください',
      '繰り返しの無断欠席は、今後の参加制限の対象となる場合があります',
      'イベント当日の飲食代・体験料などの費用は、案内に従って会場・主催者へお支払いください',
    ],
  },
  {
    heading: '通報・ブロック',
    body: '不安を感じたり、迷惑行為を受けた場合は、通報・ブロック機能をご利用ください。運営が内容を確認し、必要な対応を行います。',
    items: [
      '通報: イベント詳細やメンバープロフィールの「通報」から報告できます',
      'ブロック: メンバープロフィールの「ブロック」で相手を非表示にできます',
      'ブロックの管理は /account/blocked から行えます',
    ],
  },
  {
    heading: '運営による利用制限',
    body: '本ガイドラインや利用規約に違反する行為が確認された場合、運営は警告、投稿・イベントの非表示、参加制限、一時停止、アカウント削除などの措置を行うことがあります。措置の内容は個別の状況に応じて判断します。',
  },
  {
    heading: '退会について',
    body: 'アカウントの削除（退会）は、ログイン後 /account/delete からご自身で手続きできます。',
  },
];

export const metadata = {
  title: 'コミュニティガイドライン',
  description: 'HANAKAI Connection コミュニティガイドライン',
};

export default async function CommunityGuidelinesPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='mx-auto max-w-[680px] space-y-8'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            COMMUNITY GUIDELINES
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            コミュニティガイドライン
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            誰もが安心してイベントに参加できるよう、HANAKAI をご利用いただくすべての方にお願いしているルールです。
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
            href='/account/blocked'
            className='inline-flex h-11 items-center justify-center rounded-full border border-[#d8d6d1] px-6 text-sm font-medium text-[#6b6b6b] transition active:scale-[0.98]'
          >
            ブロック管理
          </Link>
          <Link
            href='/contact'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
