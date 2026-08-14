import { listAllCategoriesAsAdmin, listProductsAsAdmin } from '@/lib/api'
import { toErrorSummary } from '@/lib/format'
import { parsePaginationSearchParams, type PageSearchParams } from '@/lib/pagination'
import type { Category, PaginatedResponse, Product, ProductFilterParams } from '@/lib/types'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ProductFiltersDialog } from '@/components/products/product-filters-dialog'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import { ProductsTable } from '@/components/products/products-table'
import { ResourceError } from '@/components/resource-error'

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null }
  } catch (error) {
    return { data: null, error: toErrorSummary(error) }
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const pagination = parsePaginationSearchParams((await searchParams) ?? {})
  const [productsResult, categoriesResult] = await Promise.all([
    safeLoad<PaginatedResponse<Product>>(() => listProductsAsAdmin(pagination)),
    safeLoad<Category[]>(listAllCategoriesAsAdmin),
  ])
  const productsPage = productsResult.data
  const products = productsPage?.items ?? []
  const categories = categoriesResult.data ?? []
  const filters: ProductFilterParams = {
    ...(pagination.categoryId ? { categoryId: pagination.categoryId } : {}),
    ...(pagination.status ? { status: pagination.status } : {}),
    ...(pagination.minPrice !== undefined ? { minPrice: pagination.minPrice } : {}),
    ...(pagination.maxPrice !== undefined ? { maxPrice: pagination.maxPrice } : {}),
    ...(pagination.updatedFrom ? { updatedFrom: pagination.updatedFrom } : {}),
    ...(pagination.updatedTo ? { updatedTo: pagination.updatedTo } : {}),
    ...(pagination.q ? { q: pagination.q } : {}),
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
            limit={pagination.limit}
            scannedCount={productsPage?.scannedCount}
          />
          <ProductFormDialog categories={categories} />
        </div>
      </div>

      {productsResult.error ? (
        <ResourceError
          title='Products endpoint error'
          message={productsResult.error.message}
          details={productsResult.error.details}
        />
      ) : null}
      {categoriesResult.error ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesResult.error.message}
          details={categoriesResult.error.details}
        />
      ) : null}

      {!productsResult.error ? (
        <>
          <ProductsTable products={products} categories={categories} />
          {productsPage ? (
            <PaginationControls
              limit={productsPage.limit}
              currentPage={productsPage.currentPage}
              previousCursor={productsPage.previousCursor}
              nextCursor={productsPage.nextCursor}
              filters={filters}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
