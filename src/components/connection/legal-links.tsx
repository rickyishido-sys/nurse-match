import Link from 'next/link';

type LegalLinksProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

export function LegalLinks({ className = '', variant = 'light' }: LegalLinksProps) {
  const linkClass =
    variant === 'dark'
      ? 'underline-offset-4 hover:underline'
      : 'underline underline-offset-2';

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 text-[11px] ${className}`}>
      <Link href='/terms' className={linkClass}>
        利用規約
      </Link>
      <Link href='/privacy' className={linkClass}>
        プライバシーポリシー
      </Link>
      <Link href='/legal/tokushoho' className={linkClass}>
        特定商取引法
      </Link>
      <Link href='/contact' className={linkClass}>
        お問い合わせ
      </Link>
    </div>
  );
}
