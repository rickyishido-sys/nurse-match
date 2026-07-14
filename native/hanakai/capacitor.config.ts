import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Override appId for alternate bundle IDs (e.g. staging):
 *   HANAKAI_APP_ID=design.kranz.hanakai.staging npx cap sync
 */
const appId = process.env.HANAKAI_APP_ID ?? 'design.kranz.hanakai';

/**
 * App icons (source assets in the Next.js repo root):
 *   - ../../public/icon.png          — primary app icon (use 512×512 or larger)
 *   - ../../public/apple-touch-icon.png — iOS home-screen icon (180×180)
 *
 * After `npx cap add ios` / `npx cap add android`, generate platform assets with
 * `@capacitor/assets` or Xcode / Android Studio using the files above.
 */
const config: CapacitorConfig = {
  appId,
  appName: '華会 HANAKAI',
  webDir: 'www',

  server: {
    // Production: load the deployed HANAKAI Connection web app.
    url: 'https://hanakai.kranz.design/',

    // --- Development override (uncomment for local Next.js) ---
    // url: 'http://localhost:3000',
    // cleartext: true, // required for http:// on Android
    //
    // Or point at a preview deployment:
    // url: 'https://your-preview.vercel.app',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    Camera: {
      // Photo upload uses getPhoto(); see README.
    },
  },
};

export default config;
