import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * next-intl plugin wires the i18n request configuration into the build.
 * Point it at the request config so server components can resolve messages.
 */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Type-safe `Link`/`router` routes.
  typedRoutes: true,
  images: {
    remotePatterns: [
      // Royalty-free catalogue photography (see `shared/lib/imagery.ts`).
      // Replace with the CMS asset host once admin uploads the real catalogue.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Add CDN / asset hosts served by the backend here.
      // { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
