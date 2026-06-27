import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import './globals.css';

const SITE_TITLE = 'HANAKAI Connection';
const SITE_DESCRIPTION = '人と人との新しいConnectionを生み出す、リアル体験プラットフォーム。';

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
});

const notoSerif = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'HANAKAI Connection',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon-192.svg?v=3', type: 'image/svg+xml' }],
    shortcut: [{ url: '/icons/icon-192.svg?v=3', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-512.svg?v=3', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HANAKAI Connection',
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
  themeColor: '#1a1a1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className={`${noto.variable} ${notoSerif.variable} h-full`}>
      <body className='min-h-full font-sans text-slate-900'>{children}</body>
    </html>
  );
}
