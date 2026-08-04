import { DEFAULT_HANAKAI_USAGE_FEE_JPY } from '@/lib/connection/hanakai-usage-fee/constants';

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Server-side env override (single deploy-time source before settings table is wired). */
export function readHanakaiUsageFeeJpyFromEnv(): number {
  return (
    parsePositiveInt(process.env.HANAKAI_USAGE_FEE_JPY) ??
    parsePositiveInt(process.env.NEXT_PUBLIC_HANAKAI_USAGE_FEE_JPY) ??
    DEFAULT_HANAKAI_USAGE_FEE_JPY
  );
}

/** Client-safe display default (must stay in sync with server base fee for V1). */
export function readPublicHanakaiUsageFeeJpy(): number {
  return parsePositiveInt(process.env.NEXT_PUBLIC_HANAKAI_USAGE_FEE_JPY) ?? DEFAULT_HANAKAI_USAGE_FEE_JPY;
}
