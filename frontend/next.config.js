/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Allowing Auth0 domain in images
  images: {
    domains: ['lh3.googleusercontent.com', 's.gravatar.com'], // For Auth0 profile pictures
  },
  // Adding rewrites for API proxy to backend
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    // Remove /api from the end if present to avoid double /api
    const baseUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
