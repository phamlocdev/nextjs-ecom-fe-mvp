'use client'

import { ProductEditor } from '@/components/products/product-editor'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'

export default function NewProductPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  if (isHydrating || !isAuthenticated || categoriesResult.isLoading) {
    return <Skeleton className='h-[520px] w-full' />
  }

  if (categoriesError) {
    return (
      <ResourceError
        title='Categories endpoint error'
        message={categoriesError.message}
        details={categoriesError.details}
      />
    )
  }

  return <ProductEditor key='new-product' categories={categoriesResult.data?.items ?? []} />
}
