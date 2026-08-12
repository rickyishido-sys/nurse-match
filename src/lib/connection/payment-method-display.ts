/** Safe display helpers for saved cards (never include PAN/CVV/tokens). */

export type PaymentMethodDisplay = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
};

export function formatCardBrand(brand: string | null | undefined) {
  if (!brand) return 'カード';
  return brand.replace(/_/g, ' ').toUpperCase();
}

export function formatCardMask(last4: string | null | undefined) {
  return `•••• ${last4 && last4.length === 4 ? last4 : '****'}`;
}

export function formatPaymentMethodLine(method: Pick<PaymentMethodDisplay, 'brand' | 'last4'>) {
  return `${formatCardBrand(method.brand)} ${formatCardMask(method.last4)}`;
}
