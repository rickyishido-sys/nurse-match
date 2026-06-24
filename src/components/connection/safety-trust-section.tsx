import { Card } from '@/components/connection/ui';

type SafetyTrustSectionProps = {
  className?: string;
};

/** LP / concept 共用 — 安心・安全への取り組み */
export function SafetyTrustSection({ className = '' }: SafetyTrustSectionProps) {
  return (
    <section className={`space-y-4 border-t border-[#ebe9e4] pt-8 ${className}`}>
      <div>
        <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>SAFETY &amp; TRUST</p>
        <h2 className='mt-1 text-sm font-semibold tracking-wide text-[#1a1a1a]'>安心して参加できるConnectionのために</h2>
      </div>

      <Card className='space-y-3 bg-[#fafaf8]'>
        <p className='text-sm leading-7 text-[#4a4a4a]'>
          HANAKAIでは、参加者全員に本人確認をお願いしています。
        </p>
        <p className='text-sm leading-7 text-[#4a4a4a]'>
          さらに、公開情報や過去のメディア掲載情報等を活用した独自のTrust Verificationを実施しています。
        </p>
        <p className='text-sm leading-7 text-[#4a4a4a]'>
          見知らぬ人同士が出会うサービスだからこそ、安心して参加できる環境づくりを何よりも大切にしています。
        </p>
        <p className='text-xs leading-6 text-[#6b6b6b]'>
          もちろん、すべてのリスクを完全に排除できるわけではありません。しかし、参加者同士が安心して出会い、より深いConnectionを築ける場を提供するために、できる限りの取り組みを行っています。
        </p>
      </Card>
    </section>
  );
}
