import type { NextConfig } from 'next';

const cloudinaryCloud = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.31.8'],
    images: {
        remotePatterns: [
            ...(cloudinaryCloud
                ? [
                      {
                          protocol: 'https' as const,
                          hostname: 'res.cloudinary.com',
                          pathname: `/${cloudinaryCloud}/**`,
                      },
                  ]
                : [
                      {
                          protocol: 'https' as const,
                          hostname: 'res.cloudinary.com',
                          pathname: '/**',
                      },
                  ]),
        ],
    },
};

export default nextConfig;
