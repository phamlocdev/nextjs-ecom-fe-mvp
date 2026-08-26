import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { DeleteProductDialog } from '@/components/products/delete-product-dialog'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatVnd } from '@/lib/format'
import { getInventoryStockLabel, getInventoryStockStatus } from '@/lib/inventory'
import { getProductImageSrc } from '@/lib/product-images'
import type { Category, InventorySummary, Product } from '@/lib/types'

export function ProductsTable({
  products,
  categories,
  inventoryByProductId,
}: {
  products: Product[]
  categories: Category[]
  inventoryByProductId?: Map<string, InventorySummary>
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]))

  if (products.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No products yet</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Create the first product to populate the table.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[30%]'>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className='w-24 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const inventory = inventoryByProductId?.get(product.productId)
            const stockStatus = inventory
              ? getInventoryStockStatus(inventory.availableQuantity)
              : null
            const imageSrc = getProductImageSrc(product)

            return (
              <TableRow key={product.productId}>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate font-medium'>{product.name}</p>
                      {imageSrc ? (
                        <a href={imageSrc} target='_blank' rel='noreferrer' title='Open image URL'>
                          <ExternalLink className='size-3.5 text-muted-foreground' />
                        </a>
                      ) : null}
                    </div>
                    <p className='line-clamp-2 text-xs text-muted-foreground'>
                      {product.description}
                    </p>
                    <p className='font-mono text-[11px] text-muted-foreground'>
                      {product.productId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='space-y-1'>
                    <p className='text-sm'>
                      {categoryNames.get(product.categoryId) ?? product.categoryId}
                    </p>
                    <p className='font-mono text-[11px] text-muted-foreground'>
                      {product.categoryId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{formatVnd(product.price)}</TableCell>
                <TableCell>
                  {inventory ? (
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>{inventory.availableQuantity} available</p>
                      <p className='text-xs text-muted-foreground'>
                        {inventory.reservedQuantity} reserved
                      </p>
                      {stockStatus ? (
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
                      ) : null}
                    </div>
                  ) : (
                    <span className='text-sm text-muted-foreground'>Unavailable</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {formatDateTime(product.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    <Link
                      href={`/admin/products/${product.productId}/edit`}
                      className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      title='Edit product'
                      aria-label='Edit product'
                    >
                      <Pencil />
                    </Link>
                    <DeleteProductDialog product={product} />
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
