import { useMemo } from 'react'
import { useQueries } from 'react-query'
import { findProductById, PRODUCT_QUERY_KEYS } from '@/lib/api/products'
import type { CartDetails, Product } from '@/lib/types'

export type CartLineItem = {
  product: Product
  quantity: number
  lineTotal: number
}

export function useCartProductDetails(cart: CartDetails | undefined) {
  const productQueries = useQueries(
    (cart?.items ?? []).map((item) => ({
      queryKey: PRODUCT_QUERY_KEYS.detail(item.productId),
      queryFn: () => findProductById(item.productId),
      enabled: Boolean(cart),
    })),
  )

  const items = useMemo<CartLineItem[]>(() => {
    if (!cart) {
      return []
    }

    return cart.items
      .map((item, index) => {
        const product = productQueries[index]?.data as Product | undefined
        if (!product) {
          return null
        }

        return {
          product,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        }
      })
      .filter((item): item is CartLineItem => item !== null)
  }, [cart, productQueries])

  const isLoading = productQueries.some((query) => query.isLoading)
  const error = productQueries.find((query) => query.error)?.error ?? null
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0)

  return {
    items,
    totalAmount,
    isLoading,
    error,
  }
}
