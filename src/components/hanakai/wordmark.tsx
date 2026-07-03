import Image from 'next/image';
import Link from 'next/link';

type HanakaiWordmarkProps = {
  /** モバイル向けコンパクト表示 */
  compact?: boolean;
  /** リンク先（未指定ならリンクなし） */
  href?: string;
  className?: string;
};

export function HanakaiWordmark({ compact = false, href = '/', className = '' }: HanakaiWordmarkProps) {
  const inner = compact ? (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className='relative h-7 w-7 overflow-hidden rounded-lg'>
        <Image src='/icon.png' alt='' fill sizes='28px' className='object-cover' />
      </span>
      <span className='flex flex-col leading-none'>
        <span className='text-[13px] font-semibold tracking-[0.1em] text-[#1a1a1a]'>HANAKAI</span>
        <span className='text-[9px] font-medium tracking-[0.18em] text-[#6b6b6b]'>CONNECTION</span>
      </span>
    </span>
  ) : (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
      <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className='inline-block'>
        {inner}
      </Link>
    );
  }
  return inner;
}
