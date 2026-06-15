import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HANAKAI（花会）',
    short_name: 'HANAKAI',
    description: 'リアル花会とデジタルコミュニティを循環させる、新しいつながりのかたち。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fcfdfb',
    theme_color: '#4f7a4a',
    icons: [
      {
        src: '/icons/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
