import { formatDateTime } from '@/lib/format'
import { getInventoryStockLabel, getInventoryStockStatus } from '@/lib/inventory'
import type { Category, InventorySummary } from '@/lib/types'
import { InventoryAdjustDialog } from '@/components/inventories/inventory-adjust-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function InventoriesTable({
  inventories,
  categories,
}: {
  inventories: InventorySummary[]
  categories: Category[]
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]))

  if (inventories.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No inventory rows found</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Try broadening the search or create products to populate inventory.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[32%]'>Product</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className='w-20 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventories.map((inventory) => {
            const stockStatus = getInventoryStockStatus(inventory.availableQuantity)

            return (
              <TableRow key={inventory.productId}>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate font-medium'>{inventory.productName}</p>
                    <p className='font-mono text-[11px] text-muted-foreground'>{inventory.productId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='space-y-1'>
                    <p className='text-sm'>{categoryNames.get(inventory.categoryId) ?? inventory.categoryId}</p>
                    <div className='flex gap-2'>
                      <Badge variant={inventory.productStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                        {inventory.productStatus}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='font-medium'>{inventory.availableQuantity}</TableCell>
                <TableCell>{inventory.reservedQuantity}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      stockStatus === 'OUT_OF_STOCK'
                        ? 'destructive'
                        : stockStatus === 'LOW_STOCK'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {getInventoryStockLabel(stockStatus)}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {formatDateTime(inventory.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end'>
                    <InventoryAdjustDialog inventory={inventory} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
