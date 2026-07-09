import Image from 'next/image';
import Link from 'next/link';

export function EventsEmptyState() {
  return (
    <div className='rounded-3xl border border-[#e8dfd0] bg-gradient-to-br from-[#fbf8f3] via-[#f6f3ec] to-[#f0f5f2] px-6 py-16 text-center sm:px-10'>
      <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#e7e2d8] bg-white text-3xl shadow-[0_8px_24px_rgba(31,93,79,0.06)]' aria-hidden>
        ✿
      </div>
      <h2 className='mt-6 text-lg font-semibold text-[#1a1a1a]'>
        現在、新しいConnectionを準備しています。
      </h2>
      <p className='mx-auto mt-3 max-w-md text-sm leading-8 text-[#6b6b6b]'>
        花やコーヒー、散歩など——あなたに合う体験をひとつずつ整えています。
        公開まで、もう少しお待ちください。
      </p>
      <Link
        href='/contact?category=event'
        className='mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#1f5d4f] px-8 text-sm font-semibold text-white transition active:scale-[0.98]'
      >
        イベント開催を希望する
      </Link>
    </div>
  );
}
