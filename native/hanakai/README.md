# 華会 HANAKAI — Capacitor Native Wrapper

Capacitor shell that loads the deployed **HANAKAI Connection** web app inside native iOS and Android containers. This directory is separate from the Next.js app at the repo root; it does not bundle the web build locally.

## Quick start

```bash
cd native/hanakai
npm install

# Generate native projects (required once per machine / after clone)
npm run cap:add:ios
npm run cap:add:android

# Sync plugins and config into native projects
npm run cap:sync

# Open in IDE
npm run cap:open:ios
npm run cap:open:android
```

> **Note:** `ios/` and `android/` are created by `npx cap add ios` and `npx cap add android`. They are gitignored here; every developer runs the add commands after `npm install`.

## Production vs development URLs

| Environment | `server.url` in `capacitor.config.ts` | Notes |
|-------------|----------------------------------------|-------|
| **Production** (default) | `https://hanakai.kranz.design/` | Loads live site; no local Next.js required |
| **Local dev** | `http://localhost:3000` + `cleartext: true` | Run `npm run dev` in repo root; uncomment dev block in config |
| **Preview** | Your Vercel preview URL | Useful for QA before production promote |

The wrapper uses Capacitor **server URL mode**: the WebView navigates directly to the remote origin. The minimal `www/index.html` is only a fallback if the server URL is unreachable.

### Switching to local dev

In `capacitor.config.ts`, comment out production `url` and uncomment:

```ts
server: {
  // url: 'https://hanakai.kranz.design/',
  url: 'http://localhost:3000',
  cleartext: true,
},
```

Then re-sync: `npm run cap:sync`.

For Android emulator accessing host machine, you may need `http://10.0.2.2:3000` instead of `localhost`.

## App identity

| Field | Value | Override |
|-------|-------|----------|
| App name | 華会 HANAKAI | — |
| App ID (bundle) | `design.kranz.hanakai` | `HANAKAI_APP_ID=… npm run cap:sync` |

### Icons

Source assets live in the Next.js `public/` folder (repo root):

- `public/icon.png` — primary icon (512×512 or larger recommended)
- `public/apple-touch-icon.png` — iOS touch icon (180×180)

After adding platforms, generate native icon sets with [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) or manually in Xcode / Android Studio.

## Deep links (auth callback & password reset)

Supabase auth emails land on these paths on the web app:

| Flow | Web path | Example |
|------|----------|---------|
| Email / OAuth callback | `/auth/callback` | `https://hanakai.kranz.design/auth/callback?code=…` |
| Password reset | `/reset-password` | `https://hanakai.kranz.design/reset-password` (after `/api/auth/callback?next=/reset-password`) |

Configure native deep links so mail links open the app WebView instead of Safari/Chrome.

### Custom URL scheme (recommended baseline)

Use scheme `hanakai` (or match your appId reverse-DNS style).

**iOS** — after `cap add ios`, edit `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>hanakai</string>
    </array>
  </dict>
</array>
```

**Android** — in `android/app/src/main/AndroidManifest.xml` inside the main `<activity>`:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="hanakai" />
</intent-filter>
```

Handle incoming URLs in the WebView layer with `@capacitor/app`:

```ts
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', ({ url }) => {
  // hanakai://auth/callback?... → load production origin + path
  const target = url.replace(/^hanakai:\/\//, 'https://hanakai.kranz.design/');
  window.location.href = target;
});
```

Register Supabase redirect URLs in the dashboard:

- `https://hanakai.kranz.design/auth/callback`
- `hanakai://auth/callback` (if using custom scheme)

### Universal Links / App Links (optional, production-grade)

For `https://hanakai.kranz.design/auth/callback` and `/reset-password` to open the app directly:

**iOS**

1. Enable **Associated Domains** capability: `applinks:hanakai.kranz.design`
2. Host `apple-app-site-association` on `https://hanakai.kranz.design/.well-known/apple-app-site-association`

**Android**

1. Add intent filter with `android:autoVerify="true"` for `https://hanakai.kranz.design`
2. Host `assetlinks.json` at `https://hanakai.kranz.design/.well-known/assetlinks.json`

These require server-side `.well-known` files (outside this wrapper). Until configured, custom scheme links still work.

## Safe area (notch / home indicator)

The WebView should respect device safe areas:

1. **Web app** — ensure layout uses `viewport-fit=cover` and CSS `env(safe-area-inset-*)` padding on fixed headers/footers. The placeholder `www/index.html` already sets `viewport-fit=cover`.
2. **Status bar** — `@capacitor/status-bar` is installed. On app launch (native bootstrap or injected script), call:

   ```ts
   import { StatusBar, Style } from '@capacitor/status-bar';

   await StatusBar.setStyle({ style: Style.Light });
   await StatusBar.setBackgroundColor({ color: '#ffffff' });
   ```

3. **iOS** — in Xcode, set **Safe Area** constraints on any native chrome; the WebView should be edge-to-edge with insets handled in CSS.
4. **Android** — enable `WindowCompat.setDecorFitsSystemWindows(window, false)` if adding native overlays; otherwise default WebView + CSS insets is sufficient.

## Photo upload

Profile and post flows may use `<input type="file" accept="image/*">`. On native WebView this often works, but camera capture is more reliable via `@capacitor/camera`:

```ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri,
  source: CameraSource.Prompt, // camera or gallery
});

// Upload photo.path / webPath via existing Supabase storage API
```

**Permissions**

- iOS: add `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` to `Info.plist`
- Android: `CAMERA`, `READ_MEDIA_IMAGES` (or legacy storage per API level) in `AndroidManifest.xml`

Bridge from the web app only when running inside Capacitor (`window.Capacitor?.isNativePlatform()`).

## Push notifications (stub — not wired)

Push is **not implemented**. Do not simulate or fake delivery in QA.

When ready to integrate:

1. Add `@capacitor/push-notifications` (not included yet).
2. **iOS** — enable Push Notifications capability, upload APNs key to your provider (e.g. Supabase, Firebase).
3. **Android** — add `google-services.json`, FCM dependency.
4. Register a **receiver stub** that only logs registration — no mock payloads:

   ```ts
   import { PushNotifications } from '@capacitor/push-notifications';

   await PushNotifications.requestPermissions();
   await PushNotifications.register();

   PushNotifications.addListener('registration', (token) => {
     console.info('[push] device token registered (not sent to server yet)', token.value.slice(0, 8));
   });

   PushNotifications.addListener('pushNotificationReceived', (notification) => {
     console.info('[push] foreground notification', notification.title);
   });

   PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
     const url = action.notification.data?.url;
     if (url) window.location.href = url;
   });
   ```

5. Persist tokens server-side only after backend endpoint exists.

Until then, rely on email and in-app notifications on the web app.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync all platforms (`node scripts/sync.mjs`) |
| `npm run cap:sync:ios` | Sync iOS only |
| `npm run cap:sync:android` | Sync Android only |
| `npm run cap:add:ios` | Scaffold `ios/` project |
| `npm run cap:add:android` | Scaffold `android/` project |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:doctor` | Validate toolchain |

## Installed Capacitor plugins

- `@capacitor/app` — app lifecycle, deep link events
- `@capacitor/camera` — photo capture for uploads
- `@capacitor/share` — native share sheet
- `@capacitor/splash-screen` — launch splash
- `@capacitor/status-bar` — status bar styling

## Troubleshooting

- **`cap sync` warns no native projects** — run `cap:add:ios` and/or `cap:add:android` first.
- **Blank WebView** — verify `server.url`, device network, and SSL certificate on production.
- **Auth redirect fails** — confirm Supabase redirect allow-list includes your deep link URLs.
- **Local HTTP blocked on Android** — set `cleartext: true` and use network security config if needed.

## Related web app paths (repo root)

- Auth callback page: `src/app/auth/callback/page.tsx`
- API callback: `src/app/api/auth/callback/route.ts`
- Password reset: `src/app/reset-password/page.tsx`
- Canonical origin helper: `src/lib/connection/auth-redirect.ts`
