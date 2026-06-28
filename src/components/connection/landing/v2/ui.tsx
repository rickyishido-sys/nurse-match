'use client';

import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

// ── HANAKAI 花会 ブランドトークン ───────────────────────────────
export const HK = {
  green: '#1f5d4f',
  greenDeep: '#163f35',
  gold: '#b8956a',
  goldSoft: '#c5a66f',
  cream: '#faf7f2',
  creamWarm: '#f3ebe0',
  ink: '#1a1a1a',
  muted: '#6b6b6b',
} as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

/** スクロールで一度だけふわっと出現（prefers-reduced-motion は framer が尊重） */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** 余白を大きく取った中央寄せセクション枠（1セクション1メッセージ） */
export function Section({
  children,
  className = '',
  tone = 'cream',
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'cream' | 'white' | 'warm' | 'green';
  id?: string;
}) {
  const bg =
    tone === 'white'
      ? 'bg-white'
      : tone === 'warm'
        ? 'bg-[#f3ebe0]/60'
        : tone === 'green'
          ? 'bg-[#163f35] text-white'
          : 'bg-[#faf7f2]';
  return (
    <section id={id} className={`px-6 py-20 sm:py-24 lg:py-32 ${bg} ${className}`}>
      <div className='mx-auto w-full max-w-[1080px]'>{children}</div>
    </section>
  );
}

/** ゴールドのキッカー（POINT 0x など） */
export function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className='text-[11px] font-semibold uppercase tracking-[0.28em]'
      style={{ color: dark ? '#d8c39a' : HK.gold }}
    >
      {children}
    </p>
  );
}

/** セクション見出し（明朝・大きめ・行間ゆったり） */
export function Heading({
  children,
  dark = false,
  className = '',
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <h2
      className={`font-serif text-[1.7rem] font-semibold leading-[1.4] tracking-tight sm:text-[2rem] lg:text-[2.3rem] ${
        dark ? 'text-white' : 'text-[#1a1a1a]'
      } ${className}`}
    >
      {children}
    </h2>
  );
}

export function Lead({
  children,
  dark = false,
  className = '',
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-[15px] leading-[2] sm:text-base ${dark ? 'text-white/80' : 'text-[#5a5247]'} ${className}`}
    >
      {children}
    </p>
  );
}
