import type { NextConfig } from "next";
import './src/lib/env'; // Build-time and boot-time strict validation

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      }
    ],
  },
};

export default nextConfig;
