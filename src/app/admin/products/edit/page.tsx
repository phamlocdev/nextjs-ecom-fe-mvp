'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ProductEditor } from '@/components/products/product-editor'
import { ResourceError } from '@/components/resource-error'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useProductQuery } from '@/hooks/use-products'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

export default function EditProductPage() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId') ?? ''
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const productResult = useProductQuery(productId)
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const productError = productResult.error ? toApiClientError(productResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  if (!productId) {
    return (
      <div className='rounded-md border bg-card p-10 text-center'>
        <p className='font-medium'>Missing productId</p>
        <Link
          href='/admin/products'
          className={cn(buttonVariants({ variant: 'outline', className: 'mt-4' }))}
        >
          Back to products
        </Link>
      </div>
    )
  }

  if (isHydrating || !isAuthenticated || productResult.isLoading || categoriesResult.isLoading) {
    return <Skeleton className='h-[520px] w-full' />
  }

  if (productError) {
    return (
      <ResourceError
        title='Product endpoint error'
        message={productError.message}
        details={productError.details}
      />
    )
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

  return (
    <ProductEditor
      key={productId}
      product={productResult.data}
      categories={categoriesResult.data?.items ?? []}
    />
  )
}
