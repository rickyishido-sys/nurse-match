import type { ReferralFeeBreakdown } from '@/lib/connection/event-operations/types';

/** サービス利用料率（税抜HANAKAI対象売上に対する割合） */
export const SERVICE_FEE_RATE = 0.1;

/**
 * 端数処理: 各段階で四捨五入（Math.round）して円単位に丸める。
 * 1. イベント税抜売上 = round(税込 ÷ (1 + 売上消費税率))
 * 2. HANAKAI対象税抜売上 = round(イベント税抜 × HANAKAI人数 ÷ 総実参加)
 * 3. サービス利用料税抜 = round(HANAKAI対象 × 10%)
 * 4. 請求消費税 = round(サービス利用料税抜 × 請求消費税率)
 * 5. 請求額税込 = サービス利用料税抜 + 請求消費税
 */
function roundYen(value: number): number {
  return Math.round(value);
}

export function calculateReferralFee(input: {
  totalParticipants: number;
  hanakaiCheckinCount: number;
  grossSalesTaxIncluded: number;
  salesTaxRate?: number;
  billingTaxRate?: number;
}): ReferralFeeBreakdown {
  const salesTaxRate = input.salesTaxRate ?? 0.1;
  const billingTaxRate = input.billingTaxRate ?? salesTaxRate;
  const totalParticipants = Math.max(0, input.totalParticipants);
  const hanakaiCheckinCount = Math.max(0, input.hanakaiCheckinCount);
  const grossSalesTaxIncluded = Math.max(0, input.grossSalesTaxIncluded);

  if (hanakaiCheckinCount > totalParticipants) {
    throw new Error('HANAKAI_CHECKIN_EXCEEDS_PARTICIPANTS');
  }

  const grossSalesTaxExcluded =
    salesTaxRate > 0 ? roundYen(grossSalesTaxIncluded / (1 + salesTaxRate)) : grossSalesTaxIncluded;
  const referralRatio = totalParticipants > 0 ? hanakaiCheckinCount / totalParticipants : 0;
  const hanakaiTargetSales = roundYen(grossSalesTaxExcluded * referralRatio);
  const serviceFeeTaxExcluded = roundYen(hanakaiTargetSales * SERVICE_FEE_RATE);
  const taxAmount = roundYen(serviceFeeTaxExcluded * billingTaxRate);
  const totalAmountTaxIncluded = serviceFeeTaxExcluded + taxAmount;

  const ratioPercent = `${(referralRatio * 100).toFixed(1)}%`;

  return {
    totalParticipants,
    hanakaiCheckinCount,
    grossSalesTaxIncluded,
    salesTaxRate,
    billingTaxRate,
    grossSalesTaxExcluded,
    referralRatio,
    hanakaiTargetSales,
    serviceFeeTaxExcluded,
    taxAmount,
    totalAmountTaxIncluded,
    formulaNotes: [
      `イベント税抜売上 = 税込 ${grossSalesTaxIncluded.toLocaleString()}円 ÷ (1 + 売上税率 ${(salesTaxRate * 100).toFixed(1)}%) = ${grossSalesTaxExcluded.toLocaleString()}円`,
      `送客割合 = HANAKAIチェックイン ${hanakaiCheckinCount}人 ÷ 総実参加 ${totalParticipants}人 = ${ratioPercent}`,
      `HANAKAI対象税抜売上 = ${grossSalesTaxExcluded.toLocaleString()}円 × ${ratioPercent} = ${hanakaiTargetSales.toLocaleString()}円`,
      `サービス利用料（税抜） = ${hanakaiTargetSales.toLocaleString()}円 × 10% = ${serviceFeeTaxExcluded.toLocaleString()}円`,
      `請求消費税 = ${serviceFeeTaxExcluded.toLocaleString()}円 × 請求税率 ${(billingTaxRate * 100).toFixed(1)}% = ${taxAmount.toLocaleString()}円`,
      `請求額（税込） = ${serviceFeeTaxExcluded.toLocaleString()}円 + ${taxAmount.toLocaleString()}円 = ${totalAmountTaxIncluded.toLocaleString()}円`,
    ],
  };
}

export function generateInvoiceNumber(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = String(now.getTime()).slice(-6);
  return `HK-${y}${m}${d}-${suffix}`;
}

export function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

/** チェックイン可能ウィンドウ: 開始2時間前〜開始後6時間 */
export function isWithinCheckinWindow(startAt: string, now = new Date()): boolean {
  const start = new Date(startAt).getTime();
  if (Number.isNaN(start)) return false;
  const t = now.getTime();
  const windowStart = start - 2 * 60 * 60 * 1000;
  const windowEnd = start + 6 * 60 * 60 * 1000;
  return t >= windowStart && t <= windowEnd;
}
