import { apiClient } from '@/lib/api/api-client'
import type {
  Order,
  OrderDetails,
  EmailDeliveryStatistics,
  EmailTracking,
  EmailType,
  PaginatedResponse,
  PaymentStatus,
  PlaceOrderResponse,
  ResendEmailResult,
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
  emailTracking: (orderId: string) =>
    [...ORDER_QUERY_KEYS.detail(orderId), 'email-tracking'] as const,
  emailStatistics: () => [...ORDER_QUERY_KEYS.all, 'email-statistics'] as const,
}

export type PlaceOrderInput = {
  cartId: string
  additionalReceivingEmails?: string[]
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

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
  const response = await apiClient.post<PlaceOrderResponse>('/orders', input)
  return response.data
}

export async function triggerOrderPayment(orderId: string): Promise<TriggerPaymentResponse> {
  const response = await apiClient.post<TriggerPaymentResponse>(`/orders/${orderId}/pay`)
  return response.data
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
  const response = await apiClient.patch<Order>(`/orders/${orderId}/status`, { status })
  return response.data
}

export async function getOrderEmailStatistics(): Promise<EmailDeliveryStatistics> {
  const response = await apiClient.get<EmailDeliveryStatistics>('/orders/email-statistics')
  return response.data
}

export async function getOrderEmailTracking(orderId: string): Promise<EmailTracking[]> {
  const response = await apiClient.get<EmailTracking[]>(`/orders/${orderId}/email-tracking`)
  return response.data
}

export async function resendFailedOrderEmail(
  orderId: string,
  emailType: Extract<EmailType, 'ORDER_CONFIRMATION' | 'SHIPPED_ORDER_NOTIFICATION'>,
  recipientEmail?: string,
): Promise<ResendEmailResult> {
  const response = await apiClient.post<ResendEmailResult>(
    `/orders/${orderId}/emails/${emailType}/resend-failed`,
    recipientEmail ? { recipientEmail } : {},
  )
  return response.data
}

export function isPaymentRetryable(status: PaymentStatus): boolean {
  return status === 'NOT_STARTED' || status === 'FAILED' || status === 'PROCESSING'
}
