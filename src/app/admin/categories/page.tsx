'use client'

import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { toApiClientError } from '@/lib/api/errors'

export default function CategoriesPage() {
  const { limit, paginationParams, setCursor, setLimit } = useCatalogQueryParams()
  const categoriesResult = useCategoriesQuery({
    limit,
    ...(paginationParams.cursor ? { cursor: paginationParams.cursor } : {}),
  })
  const categoriesPage = categoriesResult.data
  const categories = categoriesPage?.items ?? []
  const error = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

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

      {error ? (
        <ResourceError
          title='Categories endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      {categoriesResult.isLoading ? (
        <CategoriesSkeleton />
      ) : !error ? (
        <>
          <CategoriesTable categories={categories} />
          {categoriesPage ? (
            <PaginationControls
              limit={categoriesPage.limit}
              currentPage={categoriesPage.currentPage}
              previousCursor={categoriesPage.previousCursor}
              nextCursor={categoriesPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function CategoriesSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  )
}
