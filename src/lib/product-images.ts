import { env } from '@/lib/env'
import type { Product, ProductImage } from '@/lib/types'

export function getPrimaryProductImage(product: Product): ProductImage | undefined {
  return product.images?.find((image) => image.isPrimary) ?? product.images?.[0]
}

export function getProductImageSrc(product: Product): string | undefined {
  return (
    getProductImagePublicSrc(getPrimaryProductImage(product)) ??
    resolveMediaPublicUrl(product.imageUrl)
  )
}

export function getProductImagePublicSrc(image: ProductImage | undefined): string | undefined {
  if (!image) {
    return undefined
  }

  return resolveMediaPublicUrl(image.key) ?? resolveMediaPublicUrl(image.readUrl)
}

export function getProductImageAlt(product: Product, image?: ProductImage): string {
  return image?.altText || product.name
}

function resolveMediaPublicUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const mediaObjectKey = getMediaObjectKey(value)
  if (env.mediaPublicBaseUrl && mediaObjectKey) {
    return `${env.mediaPublicBaseUrl}/${mediaObjectKey}`
  }

  return value
}

function getMediaObjectKey(value: string): string | undefined {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  if (!isAbsoluteUrl(normalized)) {
    return normalized.replace(/^\/+/, '')
  }

  try {
    const url = new URL(normalized)
    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const publicPrefixStart = pathname.indexOf('products/')

    return publicPrefixStart >= 0 ? pathname.slice(publicPrefixStart) : undefined
  } catch {
    return undefined
  }
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value)
}
