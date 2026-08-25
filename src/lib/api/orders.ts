import { apiClient } from '@/lib/api/api-client'
import type {
  Order,
  OrderDetails,
  PaginatedResponse,
  PaymentStatus,
  PlaceOrderResponse,
  TriggerPaymentResponse,
} from '@/lib/types'

export type FindAllOrdersQueryParams = {
  status?: string
  customerId?: string
  customerEmail?: string
  limit?: number
  cursor?: string
}

export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDER_QUERY_KEYS.all, 'list'] as const,
  list: (params?: FindAllOrdersQueryParams) => [...ORDER_QUERY_KEYS.lists(), params] as const,
  details: () => [...ORDER_QUERY_KEYS.all, 'detail'] as const,
  detail: (orderId: string) => [...ORDER_QUERY_KEYS.details(), orderId] as const,
}

export async function findAllOrders(
  params?: FindAllOrdersQueryParams,
): Promise<PaginatedResponse<Order>> {
  const response = await apiClient.get<PaginatedResponse<Order>>('/orders', { params })
  return response.data
}

export async function findOrderById(orderId: string): Promise<OrderDetails> {
  const response = await apiClient.get<OrderDetails>(`/orders/${orderId}`)
  return response.data
}

export async function placeOrder(cartId: string): Promise<PlaceOrderResponse> {
  const response = await apiClient.post<PlaceOrderResponse>('/orders', { cartId })
  return response.data
}

export async function triggerOrderPayment(orderId: string): Promise<TriggerPaymentResponse> {
  const response = await apiClient.post<TriggerPaymentResponse>(`/orders/${orderId}/pay`)
  return response.data
}

export function isPaymentRetryable(status: PaymentStatus): boolean {
  return status === 'NOT_STARTED' || status === 'FAILED' || status === 'PROCESSING'
}
