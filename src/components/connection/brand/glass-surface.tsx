import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  padding?: string;
};

/** ガラス感サーフェス */
export function GlassSurface({ children, className = '', dark = false, padding = 'p-6' }: Props) {
  const bg = dark
    ? 'bg-[rgba(22,63,53,0.55)] border-white/12 text-white'
    : 'bg-white/72 border-white/60 text-[#1a1a1a]';
  return (
    <div
      className={`rounded-[1.75rem] border backdrop-blur-xl shadow-[0_8px_32px_rgba(26,26,26,0.06)] ${bg} ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
