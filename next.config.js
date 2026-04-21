/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://http://13.49.73.95:8000';
 
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'https://api.smartcloset.cloud'},
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      // API calls
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      // Static files served by the Python backend
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
      { source: '/outputs_3d/:path*', destination: `${BACKEND}/outputs_3d/:path*` },
      { source: '/static/models/:path*', destination: `${BACKEND}/static/models/:path*` },
    ];
  },
};

module.exports = nextConfig;
