'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FAQS = [
  { q: '一人参加でも大丈夫ですか？', a: 'はい。参加者の多くが一人で参加されています。イベント中は自然に会話が生まれるように設計されていますので、初めての方でも安心してご参加いただけます。', accent: HK.coral },
  { q: '初参加でも楽しめますか？', a: 'もちろんです。ほとんどの方が初参加からスタートしています。スタッフやホストがサポートしますので、お一人でも気軽にご参加ください。', accent: HK.violet },
  { q: 'どんなイベントがありますか？', a: '花、カフェ、食事、バー、散歩、フィットネス、ダーツ、アートなど、さまざまな体験イベントを開催しています。今後も新しいテーマを随時追加予定です。', accent: HK.amber },
  { q: '男性だけ・女性だけでも参加できますか？', a: 'はい。性別を問わずご参加いただけます。イベントによって対象者や参加条件が異なる場合がありますので、詳細をご確認ください。', accent: HK.sky },
  { q: '年齢制限はありますか？', a: '18歳以上の方であればご参加いただけます。20代から60代以上まで、幅広い年代の方が参加されています。', accent: HK.lime },
  { q: 'どんな人が参加していますか？', a: '新しい友人を作りたい方、趣味を広げたい方、異業種の人と出会いたい方、仕事以外のつながりを作りたい方など、さまざまな方が参加しています。共通しているのは、リアルな出会いや体験を大切にしていることです。', accent: HK.coral },
  { q: 'イベント参加後も交流できますか？', a: 'Ver1.0では、イベント後のアプリ内交流機能は提供していません。また別の体験へ参加申請することで、ゆっくり関係を重ねていけます。', accent: HK.violet },
  { q: '勧誘目的でも参加できますか？', a: 'いいえ。営業、宗教、ネットワークビジネス、投資勧誘などを目的とした参加は禁止しています。違反が確認された場合は、利用停止となる場合があります。', accent: HK.amber },
  { q: '安全対策はありますか？', a: '参加申請の確認、通報・ブロック機能、運営による対応体制を用意しています。本人確認書類の提出（任意）も利用できます。問題が発生した場合には運営が対応いたします。', accent: HK.sky },
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
              <p className='border-t border-[#f0ebe3] px-5 pb-5 pt-3 text-sm leading-[1.9] text-[#5a5247]'>{a}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </TiltFrame>
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
        <div className='flex flex-col gap-4'>
          {FAQS.map((item, i) => (
            <Item key={item.q} q={item.q} a={item.a} accent={item.accent} tilt={i % 2 === 0 ? -1.5 : 1.5} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
