'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FAQS = [
  {
    q: '一人参加でも大丈夫ですか？',
    a: 'はい。参加者の多くが一人で参加されています。イベント中は自然に会話が生まれるように設計されていますので、初めての方でも安心してご参加いただけます。',
  },
  {
    q: '初参加でも楽しめますか？',
    a: 'もちろんです。ほとんどの方が初参加からスタートしています。スタッフやホストがサポートしますので、お一人でも気軽にご参加ください。',
  },
  {
    q: 'どんなイベントがありますか？',
    a: '花、カフェ、食事、バー、散歩、フィットネス、ダーツ、アートなど、さまざまな体験イベントを開催しています。今後も新しいテーマを随時追加予定です。',
  },
  {
    q: '男性だけ・女性だけでも参加できますか？',
    a: 'はい。性別を問わずご参加いただけます。イベントによって対象者や参加条件が異なる場合がありますので、詳細をご確認ください。',
  },
  {
    q: '年齢制限はありますか？',
    a: '18歳以上の方であればご参加いただけます。20代から60代以上まで、幅広い年代の方が参加されています。',
  },
  {
    q: 'どんな人が参加していますか？',
    a: '新しい友人を作りたい方、趣味を広げたい方、異業種の人と出会いたい方、仕事以外のつながりを作りたい方など、さまざまな方が参加しています。共通しているのは、リアルな出会いや体験を大切にしていることです。',
  },
  {
    q: 'イベント参加後も交流できますか？',
    a: 'はい。イベント参加者限定のConnectionグループを通じて、イベント後も交流を続けることができます。',
  },
  {
    q: '勧誘目的でも参加できますか？',
    a: 'いいえ。営業、宗教、ネットワークビジネス、投資勧誘などを目的とした参加は禁止しています。違反が確認された場合は、利用停止となる場合があります。',
  },
  {
    q: '安全対策はありますか？',
    a: '安心して参加いただけるよう、運営による監視・通報機能・本人確認機能を用意しています。問題が発生した場合には運営が対応いたします。',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className='border-b border-[#ece3d4]'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between gap-4 py-5 text-left'
        aria-expanded={open}
      >
        <span className='text-[15px] font-semibold text-[#1a1a1a]'>{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className='shrink-0 text-xl font-light text-[#b8956a]'
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
            className='overflow-hidden'
          >
            <p className='pb-5 text-sm leading-[1.9] text-[#6b6b6b]'>{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingFaq() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>FAQ</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>よくある質問</Heading>
        </Reveal>
      </div>

      <Reveal delay={0.1} className='mx-auto mt-10 max-w-[680px]'>
        <div>
          {FAQS.map((item) => (
            <Item key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
