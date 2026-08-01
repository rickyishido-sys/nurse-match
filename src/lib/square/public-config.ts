export const PAYMENT_CONSENT_VERSION = '2026-08-02-square-card-on-file';

export const PAYMENT_CONSENT_TEXT =
  'カード情報をSquareへ保存し、参加メンバーに選ばれた場合にHANAKAI参加費500円が自動請求されることに同意します';

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
