'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { EmailStatisticsCards } from '@/components/email/email-statistics-cards'
import { AdminOrdersTable } from '@/components/orders/admin-orders-table'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import {
  useOrderEmailStatisticsQuery,
  useOrdersQuery,
  useUpdateOrderStatusMutation,
} from '@/hooks/use-orders'
import { toApiClientError } from '@/lib/api/errors'
import type { Order, OrderStatus } from '@/lib/types'

export default function AdminOrdersPage() {
  const { limit, paginationParams, setCursor, setLimit } = useCatalogQueryParams()
  const ordersResult = useOrdersQuery({
    limit,
    ...(paginationParams.cursor ? { cursor: paginationParams.cursor } : {}),
  })
  const statisticsResult = useOrderEmailStatisticsQuery()
  const updateStatusMutation = useUpdateOrderStatusMutation()
  const [updatingOrderId, setUpdatingOrderId] = useState<string>()
  const ordersPage = ordersResult.data
  const orders = ordersPage?.items ?? []
  const ordersError = ordersResult.error ? toApiClientError(ordersResult.error) : null
  const statisticsError = statisticsResult.error ? toApiClientError(statisticsResult.error) : null

  async function handleStatusChange(order: Order, status: OrderStatus) {
    if (status !== 'SHIPPED' || status === order.status) {
      return
    }

    setUpdatingOrderId(order.orderId)
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.orderId, status })
      toast.success('Order marked as shipped.')
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setUpdatingOrderId(undefined)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Orders</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage order status and customer email delivery.
          </p>
        </div>
      </div>

      {ordersError ? (
        <ResourceError
          title='Orders endpoint error'
          message={ordersError.message}
          details={ordersError.details}
        />
      ) : null}
      {statisticsError ? (
        <ResourceError
          title='Email statistics endpoint error'
          message={statisticsError.message}
          details={statisticsError.details}
        />
      ) : null}

      <EmailStatisticsCards
        statistics={statisticsResult.data}
        emailTypes={['ORDER_CONFIRMATION', 'SHIPPED_ORDER_NOTIFICATION']}
      />

      {ordersResult.isLoading ? (
        <OrdersSkeleton />
      ) : !ordersError ? (
        <>
          <AdminOrdersTable
            orders={orders}
            updatingOrderId={updatingOrderId}
            onStatusChange={handleStatusChange}
          />
          {ordersPage ? (
            <PaginationControls
              limit={ordersPage.limit}
              currentPage={ordersPage.currentPage}
              previousCursor={ordersPage.previousCursor}
              nextCursor={ordersPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  )
}
