import 'server-only';

export {
  PAYMENT_CONSENT_VERSION,
  PAYMENT_CONSENT_TEXT,
  getPublicSquareConfig,
  type SquareEnvironment,
} from '@/lib/square/public-config';

export function getSquareEnvironment(): import('@/lib/square/public-config').SquareEnvironment {
  const env = process.env.SQUARE_ENVIRONMENT ?? process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT ?? 'sandbox';
  return env === 'production' ? 'production' : 'sandbox';
}

export function getSquareConfig() {
  const environment = getSquareEnvironment();
  const applicationId =
    process.env.SQUARE_APPLICATION_ID ?? process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? '';
  const accessToken = process.env.SQUARE_ACCESS_TOKEN ?? '';
  const locationId =
    process.env.SQUARE_LOCATION_ID ?? process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? '';
  const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? '';
  const webhookNotificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ?? '';

  return {
    environment,
    applicationId,
    accessToken,
    locationId,
    webhookSignatureKey,
    webhookNotificationUrl,
    isConfigured: Boolean(applicationId && accessToken && locationId),
  };
}

export function assertSquareServerConfigured() {
  const config = getSquareConfig();
  if (!config.isConfigured) {
    throw new Error('Square is not configured. Set SQUARE_APPLICATION_ID, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID.');
  }
  return config;
}
