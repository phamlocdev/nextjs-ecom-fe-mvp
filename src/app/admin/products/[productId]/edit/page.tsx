'use client'

import { useParams } from 'next/navigation'
import { ProductFormPage } from '@/components/products/product-form-page'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductQuery } from '@/hooks/use-products'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'

export default function EditProductPage() {
  const params = useParams<{ productId: string }>()
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const productResult = useProductQuery(params.productId)
  const productError = productResult.error ? toApiClientError(productResult.error) : null

  if (isHydrating || !isAuthenticated || productResult.isLoading) {
    return <Skeleton className='h-96 w-full' />
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

  return <ProductFormPage product={productResult.data} />
}
