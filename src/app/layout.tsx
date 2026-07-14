import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import { BRAND_OG_TAGLINE } from '@/lib/connection/brand/logo';
import './globals.css';

const SITE_TITLE = '華会 HANAKAI';
const SITE_DESCRIPTION = '体験から始まる、新しい出会い。週替わりのリアルイベントを探して参加申請できるコミュニティ。';
const ICON_VERSION = '7';

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
    description: BRAND_OG_TAGLINE,
    url: SITE_URL,
    locale: 'ja_JP',
    images: [{ url: `/og-image.png?v=${ICON_VERSION}`, width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: BRAND_OG_TAGLINE,
    images: [`/og-image.png?v=${ICON_VERSION}`],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: 'any' },
      { url: `/icon.png?v=${ICON_VERSION}`, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [{ url: `/favicon.ico?v=${ICON_VERSION}`, sizes: 'any' }],
    apple: [{ url: `/apple-touch-icon.png?v=${ICON_VERSION}`, sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HANAKAI',
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
  themeColor: '#2F6F62',
};

/** Site URL 着地の auth パラメータを /auth/callback へ即時転送（トップを経由させない） */
const AUTH_HASH_REDIRECT_SCRIPT = `(function(){try{var p=location.pathname,s=location.search,h=location.hash;if(p==='/auth/callback')return;if(s&&(s.indexOf('code=')>-1||s.indexOf('token_hash=')>-1)){location.replace('/auth/callback'+s);return}if(h&&(/access_token|refresh_token/.test(h))){location.replace('/auth/callback'+h)}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className={`${noto.variable} ${notoSerif.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: AUTH_HASH_REDIRECT_SCRIPT }} />
      </head>
      <body className='min-h-full font-sans text-slate-900'>
        {children}
      </body>
    </html>
  );
}
