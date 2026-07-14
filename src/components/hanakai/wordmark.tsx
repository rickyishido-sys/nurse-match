import { BrandLogo } from '@/components/connection/brand/brand-logo';

type HanakaiWordmarkProps = {
  /** モバイル向けコンパクト表示 */
  compact?: boolean;
  /** リンク先（未指定ならリンクなし） */
  href?: string;
  className?: string;
};

/** @deprecated Use BrandLogo — kept for legacy imports */
export function HanakaiWordmark({ compact = false, href = '/', className = '' }: HanakaiWordmarkProps) {
  return (
    <BrandLogo
      href={href}
      size={compact ? 'sm' : 'md'}
      iconOnly={compact}
      className={className}
    />
  );
}
