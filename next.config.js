/** @type {import('next').NextConfig} */
const BACKEND =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,

  // ✅ Désactiver le cache HTTP côté navigateur / CDN
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // ✅ Images
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  // ✅ Proxy backend
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
      { source: '/outputs_3d/:path*', destination: `${BACKEND}/outputs_3d/:path*` },
      { source: '/static/models/:path*', destination: `${BACKEND}/static/models/:path*` },
    ];
  },
};

module.exports = withPWA(nextConfig);