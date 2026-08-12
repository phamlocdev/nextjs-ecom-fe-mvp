import { listCategories } from '@/lib/api'
import { toErrorSummary } from '@/lib/format'
import { parsePaginationSearchParams, type PageSearchParams } from '@/lib/pagination'
import type { Category, PaginatedResponse } from '@/lib/types'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { ResourceError } from '@/components/resource-error'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const pagination = parsePaginationSearchParams((await searchParams) ?? {})
  let categoriesPage: PaginatedResponse<Category> | null = null
  let errorSummary: ReturnType<typeof toErrorSummary> | null = null

  try {
    categoriesPage = await listCategories(pagination)
  } catch (error) {
    errorSummary = toErrorSummary(error)
  }

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

      {errorSummary ? (
        <ResourceError
          title='Categories endpoint error'
          message={errorSummary.message}
          details={errorSummary.details}
        />
      ) : (
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
      )}
    </div>
  )
}
