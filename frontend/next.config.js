/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  // Allowing Auth0 domain in images
  images: {
    domains: ['lh3.googleusercontent.com', 's.gravatar.com'], // For Auth0 profile pictures
  },
  // Adding rewrites for Auth0 callback
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
