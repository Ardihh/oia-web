import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isStandalone = process.env.BUILD_STANDALONE === '1';
const isImageOptimize = process.env.NEXT_IMAGE_OPTIMIZE === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable standalone for self-hosted Node / VPS builds, leaving Vercel unaffected
  ...(isStandalone ? { output: 'standalone' } : {}),

  trailingSlash: true,

  images: {
    unoptimized: !isImageOptimize,
    ...(isImageOptimize
      ? {
          minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'dscmuuilmrkwtuxmmyap.supabase.co',
              pathname: '/storage/v1/object/public/**',
            },
            {
              protocol: 'https',
              hostname: '*.supabase.co',
              pathname: '/storage/v1/object/public/**',
            },
          ],
        }
      : {}),
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/en/',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/en/admin/',
        permanent: true,
      },
      {
        source: '/admin/',
        destination: '/en/admin/',
        permanent: true,
      },
      {
        source: '/:locale(en|id)/stats',
        destination: '/:locale/impact/',
        permanent: true,
      },
      {
        source: '/:locale(en|id)/stats/',
        destination: '/:locale/impact/',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.googleapis.com https://translate.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://dscmuuilmrkwtuxmmyap.supabase.co https://*.supabase.co https://images.unsplash.com https://translate.googleapis.com https://translate.google.com; connect-src 'self' https://dscmuuilmrkwtuxmmyap.supabase.co https://*.supabase.co https://api.web3forms.com https://translate.googleapis.com https://api.mymemory.translated.net; frame-src 'self' https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com;",
          },
        ],
      },
      {
        source: '/:locale(en|id)/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
