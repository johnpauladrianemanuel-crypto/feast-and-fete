import { imageHosts } from './image-hosts.config.mjs';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfigFunction} */
const nextConfig = (phase) => ({
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || (phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'),

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  }
});
export default nextConfig;