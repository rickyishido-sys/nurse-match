import type { SocialLinkPlatform } from '@/lib/connection/bloom-profile-options';

function stripAt(handle: string): string {
  return handle.replace(/^@+/, '').trim();
}

function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value) || value.includes('/');
}

/** URLまたはユーザー名を正規化してフルURLに変換 */
export function normalizeSocialLinkUrl(platform: SocialLinkPlatform, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (looksLikeUrl(trimmed)) {
    return ensureHttps(trimmed);
  }

  const handle = stripAt(trimmed);
  if (!handle) return '';

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    case 'threads':
      return `https://threads.net/@${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'note':
      return `https://note.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'pinterest':
      return `https://www.pinterest.com/${handle}`;
    case 'website':
      return ensureHttps(handle);
    case 'other':
    default:
      return ensureHttps(handle);
  }
}

export function normalizeSocialLinks(
  links: Array<{ platform: SocialLinkPlatform; url: string; isVisibleOnProfile: boolean }>,
) {
  return links.map((link) => ({
    ...link,
    url: normalizeSocialLinkUrl(link.platform, link.url),
  }));
}
