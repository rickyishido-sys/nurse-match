import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HANAKAI Connection',
    short_name: 'Connection',
    description: '人と人との新しいConnectionを生み出す、リアル体験プラットフォーム。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafaf8',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: '/icons/icon-192.svg?v=3',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg?v=3',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-maskable.svg?v=3',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
