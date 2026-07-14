import type { MetadataRoute } from 'next';

const ICON_VERSION = '7';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '華会 HANAKAI',
    short_name: 'HANAKAI',
    description: '体験から始まる、新しい出会い。週替わりのリアルイベントを探して参加申請できるコミュニティ。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F7F3',
    theme_color: '#2F6F62',
    icons: [
      {
        src: `/icon.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `/icon.png?v=${ICON_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `/apple-touch-icon.png?v=${ICON_VERSION}`,
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: `/brand/hanakai-logo.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
