import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  findAllInventories,
  findInventoryByProductId,
  INVENTORY_QUERY_KEYS,
  updateInventory,
  type FindAllInventoriesQueryParams,
} from '@/lib/api/inventories'
import { PRODUCT_QUERY_KEYS } from '@/lib/api/products'
import type { InventoryAdjustmentValues } from '@/lib/schemas'

export function useInventoriesQuery(params?: FindAllInventoriesQueryParams) {
  return useQuery(INVENTORY_QUERY_KEYS.list(params), () => findAllInventories(params), {
    keepPreviousData: true,
  })
}

export function useInventoryQuery(productId: string) {
  return useQuery(INVENTORY_QUERY_KEYS.detail(productId), () => findInventoryByProductId(productId), {
    enabled: Boolean(productId),
  })
}

export function useUpdateInventoryMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ productId, input }: { productId: string; input: InventoryAdjustmentValues }) =>
      updateInventory(productId, input),
    {
      onSuccess: (inventory) => {
        void queryClient.invalidateQueries(INVENTORY_QUERY_KEYS.lists())
        void queryClient.invalidateQueries(INVENTORY_QUERY_KEYS.detail(inventory.productId))
        void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.lists())
        void queryClient.invalidateQueries(PRODUCT_QUERY_KEYS.detail(inventory.productId))
      },
    },
  )
}
