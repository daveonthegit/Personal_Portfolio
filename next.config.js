// Temporary: disabling contentlayer to fix build
// const { withContentlayer } = require('next-contentlayer')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Temporary: using just bundle analyzer without contentlayer
module.exports = withBundleAnalyzer(nextConfig)
