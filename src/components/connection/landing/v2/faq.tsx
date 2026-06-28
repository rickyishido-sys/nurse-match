'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Heading, Kicker, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FAQS = [
  {
    q: '一人参加でも大丈夫ですか？',
    a: 'はい。参加者の多くがお一人での参加です。花を介して自然と会話が生まれるので、はじめてでも安心してお過ごしいただけます。',
  },
  {
    q: '初心者でも参加できますか？',
    a: 'もちろんです。花の経験は問いません。講師やホストがやさしくサポートしますので、未経験の方も気軽にご参加ください。',
  },
  {
    q: '男性だけでも参加できますか？',
    a: 'はい、性別を問わずご参加いただけます。イベントによって対象が異なる場合があるため、各イベントの詳細をご確認ください。',
  },
  {
    q: '年齢制限はありますか？',
    a: '18歳以上の方であればどなたでもご参加いただけます。幅広い年代の方が集まっています。',
  },
  {
    q: 'どんな人が参加していますか？',
    a: '花が好きな方、新しい仲間を探している方など様々です。共通しているのは「リアルなつながりを大切にしたい」という想いです。',
  },
  {
    q: '勧誘目的の参加はできますか？',
    a: 'いいえ。勧誘・営業・宗教等の目的でのご参加は固くお断りしています。違反が確認された場合は利用を停止します。',
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
