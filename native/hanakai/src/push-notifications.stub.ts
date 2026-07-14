/**
 * Push notification receiver stub — NOT active until @capacitor/push-notifications is added.
 *
 * This file documents the intended integration point. It is not imported automatically.
 * See README.md § "Push notifications (stub — not wired)".
 *
 * Do not simulate push delivery in development.
 */

export const PUSH_STUB_NOTE =
  'Push notifications are not configured. Register listeners only after APNs/FCM credentials exist.';

// Example future entry point (uncomment when plugin is installed):
//
// import { PushNotifications } from '@capacitor/push-notifications';
//
// export async function registerPushStub(): Promise<void> {
//   const perm = await PushNotifications.requestPermissions();
//   if (perm.receive !== 'granted') return;
//
//   await PushNotifications.register();
//
//   PushNotifications.addListener('registration', (token) => {
//     console.info('[hanakai push stub] registered', token.value.slice(0, 8));
//   });
// }
