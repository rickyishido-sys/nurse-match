import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // イベント写真は最大5枚 × 10MB を許容するため余裕を持たせる。
      bodySizeLimit: '55mb',
    },
  },
  async redirects() {
    return [
      { source: '/register/continue', destination: '/register', permanent: false },
      { source: '/auth/complete', destination: '/register/profile', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage（event-images バケットの公開URL）
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
