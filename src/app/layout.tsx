import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'Nurse Match β',
  description: '看護師女性主導のマッチングアプリ MVP',
  applicationName: 'Nurse Match',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.png?v=2', type: 'image/png' }, { url: '/favicon.ico?v=2', type: 'image/x-icon' }],
    shortcut: [{ url: '/favicon.ico?v=2', type: 'image/x-icon' }],
    apple: [{ url: '/icons/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nurse Match',
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className={`${noto.variable} h-full`}>
      <body className='min-h-full font-sans text-slate-900'>{children}</body>
    </html>
  );
}
