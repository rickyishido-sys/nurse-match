/** Public analytics IDs — only enable when real env values are set (no placeholder IDs). */

function cleanId(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^(YOUR_|TODO|PLACEHOLDER|xxx|test)/i.test(v)) return null;
  return v;
}

export function getGaMeasurementId(): string | null {
  return cleanId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

export function getMetaPixelId(): string | null {
  return cleanId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
}

export function getTikTokPixelId(): string | null {
  return cleanId(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
}

export function hasAnyAdPixelConfigured(): boolean {
  return Boolean(getGaMeasurementId() || getMetaPixelId() || getTikTokPixelId());
}
