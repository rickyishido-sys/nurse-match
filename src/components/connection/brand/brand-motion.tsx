'use client';

import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

/** スクロールフェードイン */
export function BrandReveal({
  children,
  delay = 0,
  className,
  variant = 'fadeUp',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: 'fadeUp' | 'slideIn';
}) {
  return (
    <motion.div
      className={className}
      variants={variant === 'slideIn' ? slideIn : fadeUp}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** ホバーで浮き上がるカード */
export function BrandFloatCard({
  children,
  className = '',
  offset = 0,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  return (
    <motion.div
      className={className}
      style={{ marginTop: offset ? `${offset}px` : undefined }}
      whileHover={{ y: -6, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
    >
      {children}
    </motion.div>
  );
}
