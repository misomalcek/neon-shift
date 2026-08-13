/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/neon-shift',
  assetPrefix: '/neon-shift',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
