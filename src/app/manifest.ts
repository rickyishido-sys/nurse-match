import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HANAKAI Connection',
    short_name: 'HANAKAI',
    description: '知らない人同士がリアルで出会う、週替わりのイベントコミュニティ。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F7F3',
    theme_color: '#2F6F62',
    icons: [
      {
        src: '/icon.png?v=6',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.png?v=6',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png?v=6',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable.svg?v=6',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
