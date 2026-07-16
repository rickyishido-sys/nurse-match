import type { SocialLinkPlatform } from '@/lib/connection/bloom-profile-options';

const ALLOWED_HOSTS: Record<SocialLinkPlatform, RegExp[]> = {
  instagram: [/^(www\.)?instagram\.com$/i],
  threads: [/^(www\.)?threads\.(net|com)$/i],
  x: [/^(www\.)?(x|twitter)\.com$/i],
  facebook: [/^(www\.)?facebook\.com$/i, /^(www\.)?fb\.com$/i],
  tiktok: [/^(www\.)?tiktok\.com$/i],
  youtube: [/^(www\.)?(youtube\.com|youtu\.be)$/i],
  pinterest: [/^(www\.)?pinterest\.(com|jp)$/i],
  note: [/^(www\.)?note\.com$/i],
  linkedin: [/^(www\.)?linkedin\.com$/i],
  website: [/.+/],
  other: [/.+/],
};

const DANGEROUS_SCHEME = /^(javascript|data|vbscript|file):/i;

function stripAt(handle: string): string {
  return handle.replace(/^@+/, '').trim();
}

function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, 'https://');
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value) || value.includes('/');
}

function hostMatchesPlatform(hostname: string, platform: SocialLinkPlatform): boolean {
  const patterns = ALLOWED_HOSTS[platform] ?? ALLOWED_HOSTS.website;
  return patterns.some((re) => re.test(hostname));
}

function detectPlatformFromHost(hostname: string): SocialLinkPlatform {
  const entries = Object.entries(ALLOWED_HOSTS) as Array<[SocialLinkPlatform, RegExp[]]>;
  for (const [platform, patterns] of entries) {
    if (platform === 'website' || platform === 'other') continue;
    if (patterns.some((re) => re.test(hostname))) return platform;
  }
  return 'website';
}

/** 危険なURLを拒否し、許可ドメインへ正規化 */
export function sanitizeSocialUrl(
  platform: SocialLinkPlatform,
  raw: string,
): { platform: SocialLinkPlatform; url: string } | null {
  const trimmed = raw.trim();
  if (!trimmed || DANGEROUS_SCHEME.test(trimmed)) return null;

  let candidate = trimmed;
  if (!looksLikeUrl(trimmed)) {
    candidate = normalizeSocialLinkUrl(platform, trimmed);
  } else {
    candidate = ensureHttps(trimmed);
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return null;
    const hostname = parsed.hostname.toLowerCase();
    const resolvedPlatform = hostMatchesPlatform(hostname, platform)
      ? platform
      : detectPlatformFromHost(hostname);
    if (resolvedPlatform !== 'website' && !hostMatchesPlatform(hostname, resolvedPlatform)) {
      return null;
    }
    return { platform: resolvedPlatform, url: parsed.toString() };
  } catch {
    return null;
  }
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
  const seen = new Set<SocialLinkPlatform>();
  const normalized: Array<{ platform: SocialLinkPlatform; url: string; isVisibleOnProfile: boolean }> = [];

  for (const link of links) {
    const sanitized = sanitizeSocialUrl(link.platform, link.url);
    if (!sanitized) continue;
    if (seen.has(sanitized.platform)) continue;
    seen.add(sanitized.platform);
    normalized.push({
      ...link,
      platform: sanitized.platform,
      url: sanitized.url,
    });
  }

  return normalized;
}
