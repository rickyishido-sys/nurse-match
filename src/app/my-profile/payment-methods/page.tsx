import { redirect } from 'next/navigation';

/** Legacy path → canonical account payment methods. */
export default function LegacyPaymentMethodsRedirect() {
  redirect('/account/payment-methods');
}
