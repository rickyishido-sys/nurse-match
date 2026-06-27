import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

const SECTIONS: { heading: string; body: string; items?: string[] }[] = [
  {
    heading: '取得する情報',
    body: 'HANAKAI Connection（以下「本サービス」）では、安心してつながれる場を提供するために、必要最小限の情報のみを取得します。',
    items: [
      'プロフィール情報（ニックネーム・年代・お住まいの地域・価値観・興味関心など）',
      'イベント申請情報（参加希望・申請理由など）',
      '参加履歴（参加したConnection Eventの記録）',
      'Connection履歴（イベントを通じて生まれたつながりの記録）',
    ],
  },
  {
    heading: '利用目的',
    body: '取得した情報は、以下の目的の範囲内でのみ利用します。',
    items: [
      '運営確認・安全確認（安心して参加できる環境づくり）',
      '参加者選定およびConnection設計（より良い出会いの組み合わせの検討）',
      '通報対応（迷惑行為・ハラスメント等への対応）',
      'サービス改善（体験品質の向上）',
    ],
  },
  {
    heading: '第三者提供について',
    body: 'ご本人の同意がある場合、または法令に基づく場合を除き、取得した情報を権限のない第三者へ開示・提供することはありません。',
  },
  {
    heading: '保管と削除',
    body: '退会時にはデータを論理削除し、法令順守に必要な期間のみ保持します。安全確認・通報対応のために、利用履歴を確認する場合があります。',
  },
];

export default async function PrivacyPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer}>
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
        </div>

        <div className='space-y-4'>
          {SECTIONS.map((section) => (
            <section
              key={section.heading}
              className='space-y-3 rounded-3xl border border-[#ebe5dc] bg-white p-6 shadow-[0_2px_12px_rgba(26,26,26,0.04)]'
            >
              <h2 className='text-base font-semibold text-[#1a1a1a]'>{section.heading}</h2>
              <p className='text-sm leading-7 text-[#5a5247]'>{section.body}</p>
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

        <div className='flex flex-wrap gap-3'>
          <Link
            href='/terms'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            利用規約を見る
          </Link>
          <Link
            href='/'
            className='inline-flex h-11 items-center justify-center rounded-full border border-[#d8d6d1] px-6 text-sm font-medium text-[#6b6b6b] transition active:scale-[0.98]'
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
