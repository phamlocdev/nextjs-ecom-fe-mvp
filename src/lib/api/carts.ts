import { apiClient } from '@/lib/api/api-client'
import type { Cart, CartDetails } from '@/lib/types'

export const CART_QUERY_KEYS = {
  all: ['cart'] as const,
  active: () => [...CART_QUERY_KEYS.all, 'active'] as const,
  detail: (cartId: string | null) => [...CART_QUERY_KEYS.all, 'detail', cartId] as const,
  lists: () => [...CART_QUERY_KEYS.all, 'list'] as const,
}

export async function findAllCarts(): Promise<Cart[]> {
  const response = await apiClient.get<Cart[]>('/carts')
  return response.data
}

export async function createCart(input: { ttlDays?: number } = {}): Promise<Cart> {
  const response = await apiClient.post<Cart>('/carts', input)
  return response.data
}

export async function findCartById(cartId: string): Promise<CartDetails> {
  const response = await apiClient.get<CartDetails>(`/carts/${cartId}`)
  return response.data
}

export async function addCartItem(input: {
  cartId: string
  productId: string
  quantity: number
}): Promise<CartDetails> {
  const response = await apiClient.post<CartDetails>(`/carts/${input.cartId}/items`, {
    productId: input.productId,
    quantity: input.quantity,
  })
  return response.data
}

export async function updateCartItem(input: {
  cartId: string
  productId: string
  quantity: number
}): Promise<CartDetails> {
  const response = await apiClient.patch<CartDetails>(
    `/carts/${input.cartId}/items/${input.productId}`,
    {
      quantity: input.quantity,
    },
  )
  return response.data
}

export async function removeCartItem(input: {
  cartId: string
  productId: string
}): Promise<void> {
  await apiClient.delete(`/carts/${input.cartId}/items/${input.productId}`)
}
