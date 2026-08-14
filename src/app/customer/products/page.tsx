import { listAllCategories, listProducts } from '@/lib/api'
import { toErrorSummary } from '@/lib/format'
import { parsePaginationSearchParams, type PageSearchParams } from '@/lib/pagination'
import type { Category, PaginatedResponse, Product, ProductFilterParams } from '@/lib/types'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { CustomerProductFilters } from '@/components/customer/customer-product-filters'
import { CustomerProductsGrid } from '@/components/customer/customer-products-grid'
import { ResourceError } from '@/components/resource-error'

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null }
  } catch (error) {
    return { data: null, error: toErrorSummary(error) }
  }
}

export default async function CustomerProductsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const pagination = parsePaginationSearchParams((await searchParams) ?? {})
  const publicFilters: ProductFilterParams = {
    ...(pagination.categoryId ? { categoryId: pagination.categoryId } : {}),
    ...(pagination.minPrice !== undefined ? { minPrice: pagination.minPrice } : {}),
    ...(pagination.maxPrice !== undefined ? { maxPrice: pagination.maxPrice } : {}),
    ...(pagination.q ? { q: pagination.q } : {}),
  }

  const [productsResult, categoriesResult] = await Promise.all([
    safeLoad<PaginatedResponse<Product>>(() =>
      listProducts({ ...pagination, ...publicFilters, status: 'ACTIVE' }),
    ),
    safeLoad<Category[]>(listAllCategories),
  ])

  const productsPage = productsResult.data
  const products = productsPage?.items ?? []
  const categories = categoriesResult.data ?? []

  return (
    <div className='space-y-8'>
      <section className='grid gap-6 rounded-[2rem] border bg-white/85 p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-8'>
        <div>
          <p className='text-sm uppercase tracking-[0.2em] text-amber-700'>Public storefront</p>
          <h1 className='mt-3 text-4xl font-semibold tracking-tight text-balance'>
            Browse active products without touching the admin workspace.
          </h1>
          <p className='mt-4 max-w-2xl text-sm leading-6 text-muted-foreground'>
            This surface stays public while the admin console runs behind Cognito, API Gateway JWT
            verification, and NestJS role checks.
          </p>
        </div>
        <CustomerProductFilters categories={categories} filters={publicFilters} />
      </section>

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
          <CustomerProductsGrid products={products} categories={categories} />
          {productsPage ? (
            <PaginationControls
              limit={productsPage.limit}
              currentPage={productsPage.currentPage}
              previousCursor={productsPage.previousCursor}
              nextCursor={productsPage.nextCursor}
              filters={publicFilters}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
