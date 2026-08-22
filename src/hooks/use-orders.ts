import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  findAllOrders,
  findOrderById,
  ORDER_QUERY_KEYS,
  placeOrder,
  triggerOrderPayment,
  type FindAllOrdersQueryParams,
} from '@/lib/api/orders'
import type { OrderDetails } from '@/lib/types'

export function useOrdersQuery(params?: FindAllOrdersQueryParams) {
  return useQuery(ORDER_QUERY_KEYS.list(params), () => findAllOrders(params), {
    keepPreviousData: true,
  })
}

export function useOrderQuery(orderId: string, options?: { pollPending?: boolean; pollPayment?: boolean }) {
  return useQuery<OrderDetails>(
    ORDER_QUERY_KEYS.detail(orderId),
    () => findOrderById(orderId),
    {
      enabled: Boolean(orderId),
      refetchInterval: (data) => {
        if (!data) {
          return false
        }
        if (options?.pollPending && data.status === 'PENDING') {
          return 2000
        }
        if (options?.pollPayment && data.paymentStatus === 'PROCESSING') {
          return 2000
        }
        return false
      },
    },
  )
}

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation((cartId: string) => placeOrder(cartId), {
    onSuccess: (response) => {
      void queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(ORDER_QUERY_KEYS.detail(response.orderId))
    },
  })
}

export function useTriggerPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation((orderId: string) => triggerOrderPayment(orderId), {
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists()),
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.detail(response.orderId)),
      ])
    },
  })
}
