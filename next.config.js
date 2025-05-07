
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Basic PWA setup often involves a service worker. 
  // While not adding next-pwa directly due to its potential complexities with App Router,
  // this structure acknowledges that PWA features might require further configuration.
  // For a full PWA, a service worker would be registered, typically managed by a library or custom setup.
};

export default nextConfig;
