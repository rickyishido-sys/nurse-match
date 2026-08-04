import 'server-only';

import {
  HANAKAI_USAGE_FEE_LABEL,
  HANAKAI_USAGE_FEE_SETTING_KEY,
} from '@/lib/connection/hanakai-usage-fee/constants';
import { readHanakaiUsageFeeJpyFromEnv } from '@/lib/connection/hanakai-usage-fee/defaults';
import type { HanakaiUsageFeeCampaignKind, HanakaiUsageFeeQuote } from '@/lib/connection/hanakai-usage-fee/types';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const CACHE_TTL_MS = 60_000;
let cachedBase: { value: number; expiresAt: number } | null = null;

/**
 * Base list price (tax-included JPY). Resolution order:
 * 1. `hanakai_platform_settings.usage_fee_jpy` (future admin UI)
 * 2. `HANAKAI_USAGE_FEE_JPY` env
 * 3. `DEFAULT_HANAKAI_USAGE_FEE_JPY`
 */
export async function getHanakaiUsageFeeBaseJpy(): Promise<number> {
  const now = Date.now();
  if (cachedBase && cachedBase.expiresAt > now) {
    return cachedBase.value;
  }

  let value = readHanakaiUsageFeeJpyFromEnv();
  const admin = createAdminSupabaseClient();
  if (admin) {
    const { data } = await admin
      .from('hanakai_platform_settings')
      .select('value_int')
      .eq('key', HANAKAI_USAGE_FEE_SETTING_KEY)
      .maybeSingle();
    if (data?.value_int != null && data.value_int >= 0) {
      value = data.value_int;
    }
  }

  cachedBase = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

/** Server-side canonical export name from spec. */
export async function getHanakaiUsageFeeJpy(): Promise<number> {
  return getHanakaiUsageFeeBaseJpy();
}

/**
 * Resolve charge amount for a member (campaign-aware stub for V1).
 * V1: always standard base fee. Extend here for first_free / limited_discount / referral_free.
 */
export async function resolveHanakaiUsageFeeForMember(
  _memberId: string,
  _context: 'event_application' | 'participation_charge' | 'refund' = 'participation_charge',
): Promise<HanakaiUsageFeeQuote> {
  const baseAmountJpy = await getHanakaiUsageFeeBaseJpy();
  const campaignKind: HanakaiUsageFeeCampaignKind = 'standard';
  return {
    amountJpy: baseAmountJpy,
    label: HANAKAI_USAGE_FEE_LABEL,
    baseAmountJpy,
    campaignKind,
    isWaived: baseAmountJpy === 0,
  };
}

export function buildHanakaiUsageFeePaymentNote(eventTitle: string): string {
  return `${HANAKAI_USAGE_FEE_LABEL} / ${eventTitle}`;
}

export function buildHanakaiUsageFeeConsentText(amountJpy: number): string {
  return `カード情報をSquareへ保存し、参加メンバーに選ばれた場合に${HANAKAI_USAGE_FEE_LABEL}${amountJpy.toLocaleString('ja-JP')}円が自動請求されることに同意します`;
}

export function buildHanakaiUsageFeeChargeSuccessBody(amountJpy: number): string {
  return `登録済みカードへ${formatHanakaiUsageFeeInline(amountJpy)}を決済し、正式な参加が決定しました。`;
}

export function buildHanakaiUsageFeeChargeFailedBody(amountJpy: number): string {
  return `参加メンバーに選ばれましたが、${formatHanakaiUsageFeeInline(amountJpy)}を決済できませんでした。期限までにカード情報をご確認ください。`;
}

function formatHanakaiUsageFeeInline(amountJpy: number): string {
  return `${HANAKAI_USAGE_FEE_LABEL}${amountJpy.toLocaleString('ja-JP')}円`;
}

/** Invalidate in-process cache after future admin updates. */
export function invalidateHanakaiUsageFeeCache(): void {
  cachedBase = null;
}
