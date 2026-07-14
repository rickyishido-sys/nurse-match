import Link from 'next/link';
import { HK } from '@/lib/connection/brand/tokens';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';

export function ExperienceRequestPromoCard() {
  return (
    <section className='rounded-3xl border border-[#ebe9e4] bg-gradient-to-br from-[#f3f7f5] via-white to-[#fff8f5] p-6 shadow-[0_8px_28px_rgba(26,26,26,0.06)]'>
      <p className='text-sm font-semibold text-[#1a1a1a]'>まだ希望のイベントがありませんか？</p>
      <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
        参加したい体験をリクエストすると、需要が集まったテーマから新しいイベントが生まれます。
      </p>
      <Link
        href='/experience-request'
        prefetch
        className={`${ctaPrimary} mt-5 inline-flex min-w-[160px] transition hover:scale-[1.02] active:scale-[0.98]`}
        style={{ background: HK.coral }}
      >
        リクエストする
      </Link>
    </section>
  );
}
