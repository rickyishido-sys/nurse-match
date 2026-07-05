import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HANAKAI Connection',
    short_name: 'HANAKAI',
    description: '人と人との新しいConnectionを生み出す、リアル体験プラットフォーム。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F7F3',
    theme_color: '#2F6F62',
    icons: [
      {
        src: '/icon.png?v=5',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.png?v=5',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable.svg?v=5',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
