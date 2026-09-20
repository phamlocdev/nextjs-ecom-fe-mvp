import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const baseConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

const devDynamicRouteRewrites: NonNullable<NextConfig['rewrites']> = async () => [
  {
    source: '/products/:id',
    destination: '/products/__fallback',
  },
  {
    source: '/orders/:orderId',
    destination: '/orders/__fallback',
  },
  {
    source: '/admin/orders/:orderId',
    destination: '/admin/orders/__fallback',
  },
  {
    source: '/admin/products/:productId/edit',
    destination: '/admin/products/__fallback/edit',
  },
  {
    source: '/admin/users/:userId/access',
    destination: '/admin/users/__fallback/access',
  },
]

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      trailingSlash: true,
      images: baseConfig.images,
      rewrites: devDynamicRouteRewrites,
    }
  }

  return baseConfig
}
