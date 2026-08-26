import type { Product, ProductImage } from '@/lib/types'

export function getPrimaryProductImage(product: Product): ProductImage | undefined {
  return product.images?.find((image) => image.isPrimary) ?? product.images?.[0]
}

export function getProductImageSrc(product: Product): string | undefined {
  return getPrimaryProductImage(product)?.readUrl ?? product.imageUrl
}

export function getProductImageAlt(product: Product, image?: ProductImage): string {
  return image?.altText || product.name
}
