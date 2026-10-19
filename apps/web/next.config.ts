import type { NextConfig } from 'next';

const cloudinaryCloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiProxyOrigin = process.env.API_PROXY_ORIGIN?.trim().replace(/\/+$/, '');

/**
 * Baseline response headers.
 *
 * `Referrer-Policy` matters most here: password-reset links carry the reset
 * token in the URL path, so a page load must not attach the full URL as
 * referrer to third-party stylesheets (Google Fonts) or anywhere else.
 * `X-Frame-Options` blocks clickjacking around auth/consent UI.
 */
const securityHeaders = [
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.31.8'],
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
    async rewrites() {
        return apiProxyOrigin
            ? [
                  {
                      source: '/api/v1/:path*',
                      destination: `${apiProxyOrigin}/api/v1/:path*`,
                  },
              ]
            : [];
    },
    images: {
        remotePatterns: [
            /**
             * Only the configured Cloudinary account is proxied. A wildcard
             * fallback would turn the image optimizer into an open proxy for
             * any `res.cloudinary.com` path whenever the env var is missing.
             */
            ...(cloudinaryCloud
                ? [
                      {
                          protocol: 'https' as const,
                          hostname: 'res.cloudinary.com',
                          pathname: `/${cloudinaryCloud}/**`,
                      },
                  ]
                : []),
        ],
    },
};

export default nextConfig;
