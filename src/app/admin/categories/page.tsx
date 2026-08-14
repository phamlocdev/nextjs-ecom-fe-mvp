import { listCategoriesAsAdmin } from '@/lib/api'
import { toErrorSummary } from '@/lib/format'
import { parsePaginationSearchParams, type PageSearchParams } from '@/lib/pagination'
import type { Category, PaginatedResponse } from '@/lib/types'
import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ResourceError } from '@/components/resource-error'

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null }
  } catch (error) {
    return { data: null, error: toErrorSummary(error) }
  }
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const pagination = parsePaginationSearchParams((await searchParams) ?? {})
  const categoriesResult = await safeLoad<PaginatedResponse<Category>>(() =>
    listCategoriesAsAdmin(pagination),
  )
  const categoriesPage = categoriesResult.data
  const categories = categoriesPage?.items ?? []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Categories</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage stable category slugs through the backend `/categories` API.
          </p>
        </div>
        <CategoryFormDialog />
      </div>

      {categoriesResult.error ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesResult.error.message}
          details={categoriesResult.error.details}
        />
      ) : null}

      {!categoriesResult.error ? (
        <>
          <CategoriesTable categories={categories} />
          {categoriesPage ? (
            <PaginationControls
              limit={categoriesPage.limit}
              currentPage={categoriesPage.currentPage}
              previousCursor={categoriesPage.previousCursor}
              nextCursor={categoriesPage.nextCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
