import { apiClient } from '@/lib/api/api-client'
import type { ProductFormValues } from '@/lib/schemas'
import type { PaginatedResponse, PaginationParams, Product } from '@/lib/types'

export type FindAllProductsQueryParams = PaginationParams

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (params?: FindAllProductsQueryParams) => [...PRODUCT_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
}

export async function findAllProducts(
  params?: FindAllProductsQueryParams,
): Promise<PaginatedResponse<Product>> {
  const response = await apiClient.get<PaginatedResponse<Product>>('/products', { params })
  return response.data
}

export async function findProductById(productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${productId}`)
  return response.data
}

function toProductWritePayload(input: ProductFormValues): ProductFormValues {
  return {
    ...input,
    images: input.images.map((image) => ({
      imageKey: image.imageKey,
      alt: image.alt,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
  }
}

export async function createProduct(input: ProductFormValues): Promise<Product> {
  const response = await apiClient.post<Product>('/products', toProductWritePayload(input))
  return response.data
}

export async function updateProduct(productId: string, input: ProductFormValues): Promise<Product> {
  const response = await apiClient.patch<Product>(
    `/products/${productId}`,
    toProductWritePayload(input),
  )
  return response.data
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete(`/products/${productId}`)
}
