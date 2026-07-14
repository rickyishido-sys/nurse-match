import Link from 'next/link';

const tabs = [
  { href: '/manage', label: '参加者選定' },
  { href: '/manage/experience-requests', label: '体験リクエスト' },
] as const;

export function ManageNav({ active }: { active: 'members' | 'experience-requests' }) {
  return (
    <nav className='flex flex-wrap gap-2 border-b border-[#ebe9e4] pb-4'>
      {tabs.map((tab) => {
        const isActive =
          (active === 'members' && tab.href === '/manage') ||
          (active === 'experience-requests' && tab.href === '/manage/experience-requests');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={`rounded-full px-4 py-2 text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98] ${
              isActive ? 'bg-[#1f5d4f] text-white shadow-sm' : 'border border-[#d8d6d1] bg-white text-[#6b6b6b] hover:border-[#1f5d4f]/30'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
