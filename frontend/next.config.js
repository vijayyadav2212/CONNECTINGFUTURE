const path = require('path');

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    domains: [
      'lh3.googleusercontent.com', 
      's.gravatar.com',
      'res.cloudinary.com',
      'api.dicebear.com',
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@auth0/nextjs-auth0/client': './src/lib/mockAuth0.tsx',
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias['@auth0/nextjs-auth0/client'] = path.resolve(__dirname, 'src/lib/mockAuth0.tsx');
    return config;
  },
  // Adding redirects for old Auth0 endpoints
  async redirects() {
    return [
      {
        source: '/api/auth/login',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/api/auth/logout',
        destination: '/login',
        permanent: false,
      },
    ];
  },
  // Adding rewrites for API proxy to backend
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v2';
    const baseUrl = apiBase.endsWith('/api/v2') ? apiBase.slice(0, -7) : apiBase;
    
    return [
      {
        source: '/api/v2/:path*',
        destination: `${baseUrl}/api/v2/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/v2/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
