'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PREFECTURES } from '@/lib/connection/onboarding-options';
import type { EventsListFilterSlug } from '@/lib/connection/events-list-ux';

type Props = {
  memberAreaLabel: string | null;
  /** Canonical active region key: 'local' | 'all' | prefecture label */
  activeRegion: string;
  activeCategory: EventsListFilterSlug;
  showAreaHint?: boolean;
};

function buildEventsHref(region: string, category: EventsListFilterSlug): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (region) params.set('region', region);
  const q = params.toString();
  return q ? `/events?${q}` : '/events';
}

export function EventsRegionFilter({
  memberAreaLabel,
  activeRegion,
  activeCategory,
  showAreaHint = false,
}: Props) {
  const router = useRouter();
  const hasLocal = Boolean(memberAreaLabel);
  const isLocal = activeRegion === 'local';
  const isAll = activeRegion === 'all';
  const selectValue = isAll ? '' : isLocal ? (memberAreaLabel ?? '') : activeRegion;

  return (
    <div className='space-y-3'>
      <div>
        <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>地域から探す</p>
        {hasLocal ? (
          <p className='mt-1 text-sm text-[#4a4a4a]'>
            あなたの地域{' '}
            <span className='font-semibold text-[#1a1a1a]'>{memberAreaLabel}</span>
          </p>
        ) : (
          <p className='mt-1 text-sm text-[#4a4a4a]'>全国のイベント</p>
        )}
      </div>

      <div className='-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {hasLocal ? (
          <Link
            href={buildEventsHref('local', activeCategory)}
            className={`flex shrink-0 items-center rounded-full px-4 py-2.5 text-xs font-medium transition active:scale-[0.97] ${
              isLocal
                ? 'bg-[#1f5d4f] text-white shadow-[0_4px_14px_rgba(31,93,79,0.22)]'
                : 'border border-[#e3ddd2] bg-white text-[#4a4a4a] hover:border-[#cfe3da]'
            }`}
          >
            あなたの地域
          </Link>
        ) : null}
        <Link
          href={buildEventsHref('all', activeCategory)}
          className={`flex shrink-0 items-center rounded-full px-4 py-2.5 text-xs font-medium transition active:scale-[0.97] ${
            isAll
              ? 'bg-[#1f5d4f] text-white shadow-[0_4px_14px_rgba(31,93,79,0.22)]'
              : 'border border-[#e3ddd2] bg-white text-[#4a4a4a] hover:border-[#cfe3da]'
          }`}
        >
          全国
        </Link>
      </div>

      <label className='block'>
        <span className='sr-only'>都道府県を選ぶ</span>
        <select
          className='h-11 w-full rounded-2xl border border-[#e3ddd2] bg-white px-4 text-sm text-[#1a1a1a]'
          value={selectValue}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              router.push(buildEventsHref('all', activeCategory));
              return;
            }
            if (memberAreaLabel && value === memberAreaLabel) {
              router.push(buildEventsHref('local', activeCategory));
              return;
            }
            router.push(buildEventsHref(value, activeCategory));
          }}
        >
          <option value=''>都道府県を選ぶ（任意）</option>
          {PREFECTURES.filter((p) => p !== '海外・その他').map((pref) => (
            <option key={pref} value={pref}>
              {pref}
            </option>
          ))}
        </select>
      </label>

      {showAreaHint ? (
        <p className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          プロフィールに地域を設定すると、近くのイベントを見つけやすくなります。
        </p>
      ) : null}
    </div>
  );
}
