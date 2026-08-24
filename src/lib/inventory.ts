import type { InventoryStockStatus } from '@/lib/types'

export const LOW_STOCK_THRESHOLD = 5

export function getInventoryStockStatus(availableQuantity: number): InventoryStockStatus {
  if (availableQuantity <= 0) {
    return 'OUT_OF_STOCK'
  }

  if (availableQuantity <= LOW_STOCK_THRESHOLD) {
    return 'LOW_STOCK'
  }

  return 'IN_STOCK'
}

export function getInventoryStockLabel(status: InventoryStockStatus): string {
  switch (status) {
    case 'OUT_OF_STOCK':
      return 'Out of stock'
    case 'LOW_STOCK':
      return 'Low stock'
    default:
      return 'In stock'
  }
}
