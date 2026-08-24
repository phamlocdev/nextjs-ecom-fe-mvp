'use client'

import Link from 'next/link'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ProductFiltersDialog } from '@/components/products/product-filters-dialog'
import { ProductsTable } from '@/components/products/products-table'
import { ResourceError } from '@/components/resource-error'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useInventoriesQuery } from '@/hooks/use-inventories'
import { useProductsQuery } from '@/hooks/use-products'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function ProductsPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { filters, paginationParams, setCursor, setFilters, setLimit } = useCatalogQueryParams()
  const productsResult = useProductsQuery(paginationParams)
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const productsPage = productsResult.data
  const products = productsPage?.items ?? []
  const productIds = products.map((product) => product.productId)
  const inventoryResult = useInventoriesQuery(
    {
      productIds,
    },
    {
      enabled: isAuthenticated && !isHydrating && Boolean(productsPage) && productIds.length > 0,
    },
  )
  const categories = categoriesResult.data?.items ?? []
  const productsError = productsResult.error ? toApiClientError(productsResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null
  const inventoryError = inventoryResult.error ? toApiClientError(inventoryResult.error) : null
  const inventoryByProductId = new Map(
    (inventoryResult.data?.items ?? []).map(
      (inventory) => [inventory.productId, inventory] as const,
    ),
  )

  if (isHydrating || !isAuthenticated) {
    return <ProductsSkeleton />
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Products</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage product records through the backend `/products` API.
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <ProductFiltersDialog
            categories={categories}
            filters={filters}
            scannedCount={productsPage?.scannedCount}
            onApplyFilters={setFilters}
          />
          <Link href='/admin/products/new' className={cn(buttonVariants())}>
            <Plus />
            New product
          </Link>
        </div>
      </div>

      {productsError ? (
        <ResourceError
          title='Products endpoint error'
          message={productsError.message}
          details={productsError.details}
        />
      ) : null}
      {categoriesError ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesError.message}
          details={categoriesError.details}
        />
      ) : null}
      {inventoryError ? (
        <ResourceError
          title='Inventories endpoint error'
          message={inventoryError.message}
          details={inventoryError.details}
        />
      ) : null}

      {productsResult.isLoading ? (
        <ProductsSkeleton />
      ) : !productsError ? (
        <>
          <ProductsTable
            products={products}
            categories={categories}
            inventoryByProductId={inventoryByProductId}
          />
          {productsPage ? (
            <PaginationControls
              limit={productsPage.limit}
              currentPage={productsPage.currentPage}
              previousCursor={productsPage.previousCursor}
              nextCursor={productsPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function ProductsSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  )
}
