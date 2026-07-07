import { SOCIAL_PLATFORM_LABEL } from '@/lib/connection/bloom-profile-options';
import type { MemberSocialLink } from '@/lib/connection/types';

type MemberVisibleSocialLinksProps = {
  links: MemberSocialLink[];
  variant?: 'public' | 'owner';
};

export function MemberVisibleSocialLinks({ links, variant = 'public' }: MemberVisibleSocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className='space-y-2'>
      <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>SNS</p>
      <div className='space-y-1.5'>
        {links.map((link) => (
          <div key={link.platform} className='flex flex-wrap items-center gap-2 text-sm'>
            <span className='text-[#6b6b6b]'>{SOCIAL_PLATFORM_LABEL[link.platform] ?? link.platform}</span>
            {variant === 'owner' ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  link.isVisibleOnProfile
                    ? 'bg-[#eef4f1] text-[#1f5d4f]'
                    : 'bg-[#f3f2ef] text-[#9a9a9a]'
                }`}
              >
                {link.isVisibleOnProfile ? '公開' : '非公開'}
              </span>
            ) : null}
            <a
              href={link.url}
              target='_blank'
              rel='noopener noreferrer'
              className='break-all text-[#1f5d4f] underline-offset-2 hover:underline'
            >
              {link.url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
