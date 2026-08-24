/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: false, // Disabled to prevent double renders in dev
  // Transpile specific third-party modules if needed
  transpilePackages: [],
  // Customize the build output
  output: 'standalone',
  // Setup image remote patterns for `next/image` optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Experimental features
  experimental: {
    // Removing allowedDevOrigins as it's not supported in current Next.js version
  },
  // Cross-origin permissions for development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;