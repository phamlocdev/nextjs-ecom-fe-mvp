'use client'

import Link from 'next/link'
import { ResourceError } from '@/components/resource-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrdersQuery } from '@/hooks/use-orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'

export default function AdminOrdersPage() {
  const ordersResult = useOrdersQuery()
  const orders = ordersResult.data?.items ?? []
  const error = ordersResult.error ? toApiClientError(ordersResult.error) : null

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Orders</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Read-only order feed powered by the backend `/orders` API.
        </p>
      </div>

      {error ? (
        <ResourceError
          title='Orders endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      <div className='grid gap-4'>
        {orders.length === 0 ? (
          <Card>
            <CardContent className='py-10 text-sm text-muted-foreground'>
              No orders found.
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.orderId}>
              <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-base'>{order.orderId}</CardTitle>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {order.customerEmail ?? order.customerId}
                  </p>
                </div>
                <div className='text-sm text-muted-foreground'>
                  {formatDateTime(order.createdAt)}
                </div>
              </CardHeader>
              <CardContent className='flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex flex-wrap gap-4'>
                  <span>Status: {order.status}</span>
                  <span>Payment: {order.paymentStatus}</span>
                  <span>Total: {formatVnd(order.totalAmount ?? 0)}</span>
                </div>
                <Link href={`/admin/orders/${order.orderId}`} className='text-primary hover:underline'>
                  View detail
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
