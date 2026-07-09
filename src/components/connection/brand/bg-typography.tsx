'use client';

import { motion } from 'motion/react';

type Props = {
  text: string;
  className?: string;
  dark?: boolean;
  animate?: boolean;
};

/** 背景の巨大タイポグラフィ（華会ブランド） */
export function BgTypography({ text, className = '', dark = false, animate = true }: Props) {
  const color = dark ? 'text-white/[0.05]' : 'text-[#1f5d4f]/[0.05]';

  if (!animate) {
    return (
      <span
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[clamp(4rem,18vw,14rem)] font-semibold leading-none tracking-tight ${color} ${className}`}
        aria-hidden
      >
        {text}
      </span>
    );
  }

  return (
    <motion.div
      className={`pointer-events-none absolute left-1/2 top-1/2 ${className}`}
      aria-hidden
      animate={{ x: ['-50%', '-48%', '-50%'], y: ['-50%', '-52%', '-50%'] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      style={{ translate: '-50% -50%' }}
    >
      <span
        className={`block whitespace-nowrap font-serif text-[clamp(4rem,18vw,14rem)] font-semibold leading-none tracking-tight ${color}`}
      >
        {text}
      </span>
    </motion.div>
  );
}
