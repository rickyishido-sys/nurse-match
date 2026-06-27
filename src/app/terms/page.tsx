import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

const SECTIONS: { heading: string; body?: string; items?: string[] }[] = [
  {
    heading: '利用条件',
    items: [
      '本サービスは18歳以上の方のみご利用いただけます。',
      'プロフィールに虚偽の内容を登録することは禁止します。',
    ],
  },
  {
    heading: 'リアルイベントへの参加',
    body: 'HANAKAI Connectionは、リアルな体験を通じてつながりを育む場です。参加者が安心して過ごせるよう、次のマナーをお守りください。',
    items: [
      '他の参加者を尊重し、節度ある態度で参加してください。',
      '迷惑行為・勧誘・営業・ハラスメントは固く禁止します。',
      '集合時間・場所などイベントごとのルールに従ってください。',
    ],
  },
  {
    heading: '運営による参加管理',
    body: '安心できる場を保つため、運営は以下を行う場合があります。',
    items: [
      'イベントごとの参加承認、および参加の制限。',
      'ユーザーが作成したイベントの内容確認（審査）。',
      '規約違反が確認された場合の、利用停止・強制退会などの措置。',
    ],
  },
  {
    heading: '参加費・キャンセルについて',
    items: [
      '参加費はイベントごとに定められ、申込時にご確認いただけます。',
      'キャンセルは各イベントに定めるポリシーに従います。直前のキャンセルや無断不参加は、今後の参加が制限される場合があります。',
    ],
  },
];

export default async function TermsPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer}>
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

        <div className='flex flex-wrap gap-3'>
          <Link
            href='/privacy'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            プライバシーポリシーを見る
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
