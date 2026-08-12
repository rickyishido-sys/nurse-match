#!/usr/bin/env node
/**
 * Lightweight display helper checks (no Square / no Production).
 */
function formatCardBrand(brand) {
  if (!brand) return 'カード';
  return brand.replace(/_/g, ' ').toUpperCase();
}
function formatCardMask(last4) {
  return `•••• ${last4 && last4.length === 4 ? last4 : '****'}`;
}
function formatPaymentMethodLine(method) {
  return `${formatCardBrand(method.brand)} ${formatCardMask(method.last4)}`;
}

const cases = [
  [formatCardBrand('visa'), 'VISA'],
  [formatCardBrand('master_card'), 'MASTER CARD'],
  [formatCardMask('3408'), '•••• 3408'],
  [formatCardMask(null), '•••• ****'],
  [formatPaymentMethodLine({ brand: 'visa', last4: '3408' }), 'VISA •••• 3408'],
];

let failed = 0;
for (const [actual, expected] of cases) {
  if (actual !== expected) {
    console.error('FAIL', { actual, expected });
    failed += 1;
  }
}

if (failed) {
  process.exit(1);
}
console.log('PASS: payment method display helpers');
