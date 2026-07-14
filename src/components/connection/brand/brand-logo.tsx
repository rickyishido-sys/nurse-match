import Image from 'next/image';
import Link from 'next/link';
import { BRAND_LOGO_SRC } from '@/lib/connection/brand/logo';

const ICON_PX = {
  sm: 40,
  md: 48,
  lg: 56,
  large: 64,
} as const;

type BrandLogoSize = keyof typeof ICON_PX;

type BrandLogoProps = {
  /** ロゴ画像のみ（テキスト非表示） */
  iconOnly?: boolean;
  size?: BrandLogoSize;
  href?: string | null;
  className?: string;
  /** テキスト色: 通常 / 暗背景上 / 明背景上 */
  tone?: 'default' | 'onDark' | 'onLight';
};

function textClasses(tone: BrandLogoProps['tone'], size: BrandLogoSize) {
  const jaSize =
    size === 'large' ? 'text-[20px] sm:text-[22px]' : size === 'lg' ? 'text-[16px] sm:text-[17px]' : size === 'md' ? 'text-[15px] sm:text-[16px]' : 'text-[13px] sm:text-[14px]';
  const enSize =
    size === 'large' ? 'text-[11px] sm:text-[12px]' : size === 'lg' ? 'text-[10px] sm:text-[11px]' : 'text-[9px] sm:text-[10px]';

  const jaColor = tone === 'onDark' ? 'text-white' : tone === 'onLight' ? 'text-white' : 'text-[#1a1a1a]';
  const enColor =
    tone === 'onDark' ? 'text-white/70' : tone === 'onLight' ? 'text-white/70' : 'text-[#b8956a]';

  return { jaSize, enSize, jaColor, enColor };
}

export function BrandLogo({
  iconOnly = false,
  size = 'md',
  href = '/',
  className = '',
  tone = 'default',
}: BrandLogoProps) {
  const px = ICON_PX[size];
  const { jaSize, enSize, jaColor, enColor } = textClasses(tone, size);

  const inner = (
    <span className={`inline-flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <span
        className='relative shrink-0 overflow-hidden rounded-full bg-white shadow-[0_2px_10px_rgba(26,26,26,0.08)]'
        style={{ width: px, height: px }}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt='華会 HANAKAI'
          fill
          sizes={`${px}px`}
          className='object-cover'
          priority={size === 'lg' || size === 'large'}
        />
      </span>
      {!iconOnly ? (
        <span className='flex min-w-0 flex-col leading-none'>
          <span className={`font-serif font-semibold tracking-[0.16em] ${jaSize} ${jaColor}`}>華会</span>
          <span className={`mt-0.5 font-medium tracking-[0.28em] ${enSize} ${enColor}`}>HANAKAI</span>
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className='inline-flex min-w-0 transition-opacity hover:opacity-90 active:scale-[0.99]'>
        {inner}
      </Link>
    );
  }

  return inner;
}
