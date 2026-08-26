'use client'

import { ProductFormPage } from '@/components/products/product-form-page'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewProductPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()

  if (isHydrating || !isAuthenticated) {
    return <Skeleton className='h-96 w-full' />
  }

  return <ProductFormPage />
}
