import {
  DEFAULT_HANAKAI_USAGE_FEE_JPY,
  HANAKAI_USAGE_FEE_LABEL,
} from '@/lib/connection/hanakai-usage-fee/constants';
import { readPublicHanakaiUsageFeeJpy } from '@/lib/connection/hanakai-usage-fee/defaults';

export { DEFAULT_HANAKAI_USAGE_FEE_JPY, HANAKAI_USAGE_FEE_LABEL };

/** V1 client display amount (env or default). Server components should prefer server resolver. */
export function getDisplayHanakaiUsageFeeJpy(): number {
  return readPublicHanakaiUsageFeeJpy();
}

export function formatHanakaiUsageFee(amountJpy: number = getDisplayHanakaiUsageFeeJpy()): string {
  return `${amountJpy.toLocaleString('ja-JP')}円`;
}

/** e.g. 「HANAKAI利用料500円」 */
export function formatHanakaiUsageFeeWithLabel(amountJpy: number = getDisplayHanakaiUsageFeeJpy()): string {
  return `${HANAKAI_USAGE_FEE_LABEL}${formatHanakaiUsageFee(amountJpy)}`;
}

export function buildHanakaiUsageFeeConsentText(amountJpy: number = getDisplayHanakaiUsageFeeJpy()): string {
  return `カード情報をSquareへ保存し、参加メンバーに選ばれた場合に${formatHanakaiUsageFeeWithLabel(amountJpy)}が自動請求されることに同意します`;
}

/** Host-set event day cost (paid on-site to host/venue) — not HANAKAI usage fee. */
export function formatEventParticipationFee(fee?: number): string {
  if (!fee || fee <= 0) return 'イベント詳細をご確認ください';
  return `${fee.toLocaleString('ja-JP')}円`;
}
