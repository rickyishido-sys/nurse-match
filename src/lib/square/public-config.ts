import { buildHanakaiUsageFeeConsentText } from '@/lib/connection/hanakai-usage-fee/public';

export const PAYMENT_CONSENT_VERSION = '2026-08-02-square-card-on-file';

/** Client bundle uses display default; server card-save re-validates with live resolver. */
export const PAYMENT_CONSENT_TEXT = buildHanakaiUsageFeeConsentText();

export type SquareEnvironment = 'sandbox' | 'production';

export function getPublicSquareConfig() {
  const environment =
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  return {
    applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? '',
    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? '',
    environment,
  };
}
