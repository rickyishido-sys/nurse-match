'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const PARTICIPANT_FAQS = [
  { q: '一人参加でも大丈夫ですか？', a: 'はい。参加者の多くが一人で参加されています。イベント中は自然に会話が生まれるように設計されていますので、初めての方でも安心してご参加いただけます。', accent: HK.coral },
  { q: '初参加でも楽しめますか？', a: 'もちろんです。初めて参加される方でも安心して楽しめるように設計しています。\n不安なことがありましたら、いつでも運営事務局へお問い合わせください。', accent: HK.violet },
  { q: 'どんなイベントがありますか？', a: '花、カフェ、食事、バー、散歩、フィットネス、ダーツ、アートなど、さまざまな体験イベントを開催しています。今後も新しいテーマを随時追加予定です。', accent: HK.amber },
  { q: '男性だけ・女性だけでも参加できますか？', a: 'はい。性別を問わずご参加いただけます。イベントによって対象者や参加条件が異なる場合がありますので、詳細をご確認ください。', accent: HK.sky },
  { q: '年齢制限はありますか？', a: '18歳以上の方であればご参加いただけます。20代から60代以上まで、幅広い年代の方が参加されています。', accent: HK.lime },
  { q: 'どんな人が参加していますか？', a: '新しい友人を作りたい方、趣味を広げたい方、異業種の人と交流したい方、仕事以外のつながりを作りたい方など、さまざまな方が参加しています。共通しているのは、リアルな体験やつながりを大切にしていることです。', accent: HK.coral },
  { q: 'イベント参加後も交流できますか？', a: '現在は、イベント後のアプリ内交流機能は提供していません。\nぜひ様々なイベントへご参加いただき、趣味や価値観の合う方との新しい出会いを楽しんでいただきたいと思っています。', accent: HK.violet },
  { q: '勧誘目的でも参加できますか？', a: 'いいえ。営業、宗教、ネットワークビジネス、投資勧誘などを目的とした参加は禁止しています。違反が確認された場合は、利用停止となる場合があります。', accent: HK.amber },
  { q: '安全対策はありますか？', a: '本人確認（必須）はHANAKAI運営が実施し、認証済みの方のみイベントへご参加いただけます。\n主催者はプロフィールや参加理由などを確認し、そのイベントに合った参加者を選びます。\n万が一のトラブルに備え、通報・ブロック機能など運営による対応体制も整えています。', accent: HK.sky },
  {
    q: 'HANAKAIの利用料金はいくらですか？',
    a: 'イベントへの参加が決定した時点で、HANAKAI利用料（税込500円）を、登録済みのクレジットカードでお支払いいただきます。\n※参加が決定するまでは料金は発生しません。',
    accent: HK.coral,
  },
  {
    q: '当日お金はかかりますか？',
    a: 'イベントの内容によっては、飲食代・体験料・入場料などの費用が別途必要になる場合があります。\nその場合は、イベント当日に店舗・会場、またはイベント主催者へ直接お支払いください。\nイベントごとの費用については、募集ページに記載されていますので、事前にご確認ください。',
    accent: HK.violet,
  },
  {
    q: 'キャンセルした場合はどうなりますか？',
    a: 'イベント自体が中止となった場合は、HANAKAI利用料（税込500円）は全額返金いたします。',
    accent: HK.amber,
  },
] as const;

// 【今後実装したい仕様（設計メモ / 現時点では未実装）】
// キャンセルポリシーは主催者の自由入力ではなく、HANAKAIが用意した固定の割合から
// 選択させる方式にする。例:
//   ・当日キャンセル  ○％
//   ・前日キャンセル  ○％
//   ・2日前キャンセル ○％
// なお、イベント自体が中止になった場合は HANAKAI 利用料 500円（税込）を全額返金する
// 仕様を前提とする。
const HOST_FAQS = [
  {
    q: '開催場所の許可は誰が取得しますか？',
    a: '開催場所の利用許可や事前確認、必要に応じた場所の予約などは、イベント主催者にてお願いします。\n当日、参加者が困ることのないよう、事前に店舗・施設へ確認したうえでイベントを公開してください。',
    accent: HK.lime,
  },
  {
    q: 'イベント独自の参加費を設定できますか？',
    a: 'はい。イベント独自の参加費を設定することは可能です。\n参加費が発生する場合は、事前に参加者へ金額を明確にご案内してください。\nイベント当日に発生する飲食代・体験料・入場料などについては、店舗・会場へ直接お支払いいただく形にするか、イベント主催者が参加者から集金してまとめて店舗・会場へ支払う形にするなど、運営しやすい方法で実施してください。\nHANAKAIではイベント当日に発生する費用の徴収・管理は行いません。',
    accent: HK.sky,
  },
  {
    q: 'HANAKAIへ支払う料金はありますか？',
    a: 'HANAKAIは、イベントへの参加が決定した方から、HANAKAI利用料として500円（税込）のみをいただいております。\nイベント当日に発生する飲食代・体験料・入場料などはHANAKAIへ支払うものではありません。',
    accent: HK.coral,
  },
] as const;

function Item({ q, a, accent, tilt }: { q: string; a: string; accent: string; tilt: number }) {
  const [open, setOpen] = useState(false);
  return (
    <TiltFrame tilt={tilt} hover={false}>
      <div
        className='overflow-hidden rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.06)]'
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='flex w-full items-center justify-between gap-4 bg-white px-5 py-5 text-left'
          aria-expanded={open}
        >
          <span className='text-[15px] font-bold text-[#1a1a1a]'>{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white'
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            +
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className='overflow-hidden bg-white'
            >
              <div className='border-t border-[#f0ebe3] px-5 pb-5 pt-3 text-sm leading-[1.9] text-[#5a5247]'>
                {a
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, i) => {
                    const bullet = line.startsWith('・');
                    return (
                      <p key={i} className={i === 0 ? '' : bullet ? 'mt-0.5' : 'mt-2.5'}>
                        {line}
                      </p>
                    );
                  })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </TiltFrame>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <div className='mb-6 flex items-center justify-center gap-3'>
      <span className='h-px w-8 bg-[#e5ddd0]' aria-hidden />
      <span className='text-[13px] font-bold tracking-[0.14em] text-[#8a7d6b]'>{children}</span>
      <span className='h-px w-8 bg-[#e5ddd0]' aria-hidden />
    </div>
  );
}

function FaqGroup({
  label,
  items,
  startIndex,
  className,
}: {
  label: string;
  items: readonly { q: string; a: string; accent: string }[];
  startIndex: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <GroupLabel>{label}</GroupLabel>
      <div className='flex flex-col gap-4'>
        {items.map((item, i) => (
          <Item key={item.q} q={item.q} a={item.a} accent={item.accent} tilt={(startIndex + i) % 2 === 0 ? -1.5 : 1.5} />
        ))}
      </div>
    </div>
  );
}

export function LandingFaq() {
  return (
    <Section tone='cream' className='relative overflow-hidden'>
      <ColorBlob color={HK.violetSoft} className='right-[-6%] top-[5%]' />
      <ColorBlob color={HK.amberSoft} className='left-[-4%] bottom-[10%]' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>FAQ</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>よくある質問</Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1} className='relative z-10 mx-auto mt-10 max-w-[680px]'>
        <FaqGroup label='イベント参加者向け' items={PARTICIPANT_FAQS} startIndex={0} />
        <FaqGroup
          label='イベント主催者向け'
          items={HOST_FAQS}
          startIndex={PARTICIPANT_FAQS.length}
          className='mt-14'
        />
      </Reveal>
    </Section>
  );
}
