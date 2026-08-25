/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode
  reactStrictMode: false,
  // Transpile specific third-party modules if needed
  transpilePackages: ['@beakdash/shared', '@beakdash/sdk'],
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

  // Security and CORS Headers
  async headers() {
    return [
      {
        // Global API and security headers
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Embed Player routes (Allow framing by external web applications)
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
        ],
      },
      {
        // Main Application routes (Protect against clickjacking)
        source: '/((?!api|embed|_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;