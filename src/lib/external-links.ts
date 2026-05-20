export const EXTERNAL_LINKS = {
  support: 'https://example.com/support',
  tokushoho: 'https://example.com/tokushoho',
} as const;

export function getExternalLink(key: keyof typeof EXTERNAL_LINKS) {
  return EXTERNAL_LINKS[key];
}
