import type { HANAKAI_USAGE_FEE_LABEL } from '@/lib/connection/hanakai-usage-fee/constants';

/** Extensible campaign kinds (V1 resolves to standard only). */
export type HanakaiUsageFeeCampaignKind =
  | 'standard'
  | 'first_free'
  | 'limited_discount'
  | 'referral_free';

export type HanakaiUsageFeeQuote = {
  /** Charged amount in JPY (0 when waived). */
  amountJpy: number;
  label: typeof HANAKAI_USAGE_FEE_LABEL;
  /** Base list price before campaign adjustments. */
  baseAmountJpy: number;
  campaignKind: HanakaiUsageFeeCampaignKind;
  /** True when amountJpy is 0 due to a campaign. */
  isWaived: boolean;
  /** Optional short note for receipts / notifications. */
  campaignNote?: string;
};

export type HanakaiUsageFeeCampaignRule = {
  kind: HanakaiUsageFeeCampaignKind;
  /** Override amount when kind is limited_discount. */
  discountedAmountJpy?: number;
  /** ISO date range for limited_discount (future). */
  startsAt?: string;
  endsAt?: string;
};
