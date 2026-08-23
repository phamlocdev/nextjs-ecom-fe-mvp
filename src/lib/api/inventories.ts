import { apiClient } from '@/lib/api/api-client'
import type { InventoryAdjustmentValues } from '@/lib/schemas'
import type { InventoryPaginationParams, InventorySummary, PaginatedResponse } from '@/lib/types'

export type FindAllInventoriesQueryParams = InventoryPaginationParams

export const INVENTORY_QUERY_KEYS = {
  all: ['inventories'] as const,
  lists: () => [...INVENTORY_QUERY_KEYS.all, 'list'] as const,
  list: (params?: FindAllInventoriesQueryParams) =>
    [...INVENTORY_QUERY_KEYS.lists(), params] as const,
  details: () => [...INVENTORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (productId: string) => [...INVENTORY_QUERY_KEYS.details(), productId] as const,
}

export async function findAllInventories(
  params?: FindAllInventoriesQueryParams,
): Promise<PaginatedResponse<InventorySummary>> {
  const response = await apiClient.get<PaginatedResponse<InventorySummary>>('/inventories', {
    params: {
      ...params,
      ...(params?.productIds ? { productIds: params.productIds.join(',') } : {}),
    },
  })

  return response.data
}

export async function findInventoryByProductId(productId: string): Promise<InventorySummary> {
  const response = await apiClient.get<InventorySummary>(`/inventories/${productId}`)
  return response.data
}

export async function updateInventory(
  productId: string,
  input: InventoryAdjustmentValues,
): Promise<InventorySummary> {
  const response = await apiClient.patch<InventorySummary>(`/inventories/${productId}`, input)
  return response.data
}
