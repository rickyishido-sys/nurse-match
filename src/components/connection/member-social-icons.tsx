import type { MemberSocialLink } from '@/lib/connection/types';
import type { SocialLinkPlatform } from '@/lib/connection/bloom-profile-options';

const ICON_SIZE = 26;

type IconProps = { size?: number };

function InstagramIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.75 6a1 1 0 1 1-1 1 1 1 0 0 1 1-1z' />
    </svg>
  );
}

function XIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M18.244 2H21.5l-7.5 8.57L22.5 22h-6.7l-5.24-6.1L4.9 22H1.64l8.04-9.18L1.5 2h6.86l4.73 5.52L18.24 2zm-2.35 18h1.77L7.22 4H5.34l10.56 16z' />
    </svg>
  );
}

function ThreadsIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 3.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zm-.2 2.4c2.1.1 3.7 1.8 3.8 3.9.1 1.5-.5 2.9-1.6 3.7-1 .7-2.3.9-3.5.5-1.5-.5-2.5-1.9-2.5-3.5 0-2.2 1.8-4 4-4.1-.3.8-.4 1.7-.2 2.5z' />
    </svg>
  );
}

function FacebookIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M13.5 22v-8h2.7l.4-3.2H13.5V8.9c0-.9.3-1.6 1.7-1.6h1.5V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7v3.2h2V22h4.5z' />
    </svg>
  );
}

function TikTokIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M16.5 5.2c1 1.1 2.3 1.8 3.8 1.9V10c-1.3 0-2.5-.4-3.5-1.1v6.8a5.1 5.1 0 1 1-4.5-5.1v3.2a2 2 0 1 0 1.4 1.9V3h3.1c.2 1.2.9 2.2 1.7 2.2z' />
    </svg>
  );
}

function YouTubeIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z' />
    </svg>
  );
}

function PinterestIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2a10 10 0 0 0-3.5 19.4c-.1-.8-.2-2 .1-3 .2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5.1 2.3-5.1 5.1 0 .9.3 1.5.8 2 .1.1.1.2.1.4l-.3 1.1c0 .2-.2.3-.4.2-1.5-.7-2.4-2.8-2.4-4.5 0-3.7 3.1-8.1 9.3-8.1 5 0 8.2 3.6 8.2 7.5 0 5.2-2.9 9.1-7.2 9.1-1.4 0-2.8-.8-3.2-1.7l-.9 3.3c-.3 1.1-1.1 2.5-1.6 3.4A10 10 0 1 0 12 2z' />
    </svg>
  );
}

function NoteIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M4 4h16v16H4V4zm3 3v10h10V7H7zm2 2h6v2H9V9zm0 3h6v2H9v-2z' />
    </svg>
  );
}

function LinkedInIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M6.5 8.7H3.6V20h2.9V8.7zM5 3.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM8.7 8.7H11v1.7h.1c.3-.6 1.1-1.7 2.4-1.7 2.5 0 3 1.7 3 3.8V20h-3v-5.4c0-1.3 0-3-1.8-3-1.8 0-2.1 1.4-2.1 2.9V20H8.7V8.7z' />
    </svg>
  );
}

function WebsiteIcon({ size = ICON_SIZE }: IconProps) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9H16.8a15.5 15.5 0 0 0-1.2-5.1A8 8 0 0 1 19.9 11zM12 4c.9 1.4 1.7 3.5 2.1 6H9.9c.4-2.5 1.2-4.6 2.1-6zM7.2 5.9A15.5 15.5 0 0 0 6 11H4.1a8 8 0 0 1 3.1-5.1zM4.1 13H6c.3 1.9.8 3.6 1.2 5.1A8 8 0 0 1 4.1 13zm3.1 5.1c.5 1.5 1.1 2.8 1.9 3.9-1.4-.5-2.6-1.3-3.5-2.4.3-.5.9-1 1.6-1.5zm4.8 2.9c-.9-1.1-1.6-2.5-2.1-4h4.2c-.5 1.5-1.2 2.9-2.1 4zm4.9-2.9c-.4-1.5-.9-3.2-1.2-5.1h1.9a8 8 0 0 1-3.1 5.1zm1.2-7.1c.3-1.9.8-3.6 1.2-5.1a8 8 0 0 1 3.1 5.1h-1.9c-.3-1.9-.8-3.6-1.2-5.1z' />
    </svg>
  );
}

const PLATFORM_META: Record<
  SocialLinkPlatform,
  { label: string; Icon: React.FC<IconProps> }
> = {
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  threads: { label: 'Threads', Icon: ThreadsIcon },
  x: { label: 'X', Icon: XIcon },
  facebook: { label: 'Facebook', Icon: FacebookIcon },
  tiktok: { label: 'TikTok', Icon: TikTokIcon },
  youtube: { label: 'YouTube', Icon: YouTubeIcon },
  pinterest: { label: 'Pinterest', Icon: PinterestIcon },
  note: { label: 'note', Icon: NoteIcon },
  linkedin: { label: 'LinkedIn', Icon: LinkedInIcon },
  website: { label: 'Website', Icon: WebsiteIcon },
  other: { label: 'Website', Icon: WebsiteIcon },
};

type Props = {
  links: MemberSocialLink[];
  className?: string;
  iconSize?: number;
};

/** SNSアイコンのみ表示（URL文字列は出さない） */
export function MemberSocialIcons({ links, className = '', iconSize = ICON_SIZE }: Props) {
  const visible = links.filter((l) => l.url.trim());
  if (visible.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {visible.map((link) => {
        const meta = PLATFORM_META[link.platform] ?? PLATFORM_META.other;
        const Icon = meta.Icon;
        return (
          <a
            key={link.platform}
            href={link.url}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`${meta.label}（新しいタブで開く）`}
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e2d8] bg-white text-[#1f5d4f] transition hover:border-[#1f5d4f]/30 hover:bg-[#f7faf8]'
          >
            <Icon size={iconSize} />
          </a>
        );
      })}
    </div>
  );
}
