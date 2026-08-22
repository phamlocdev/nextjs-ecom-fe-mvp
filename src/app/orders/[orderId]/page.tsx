'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ArrowRight, RefreshCcw } from 'lucide-react'
import { ResourceError } from '@/components/resource-error'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderQuery } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { isPaymentRetryable } from '@/lib/api/orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function OrderDetailPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const orderResult = useOrderQuery(orderId, { pollPending: true })
  const orderError = orderResult.error ? toApiClientError(orderResult.error) : null

  const canPay = useMemo(() => {
    const order = orderResult.data
    const isExpired =
      typeof order?.paymentExpiresAt === 'number' &&
      order.paymentExpiresAt <= Math.floor(Date.now() / 1000)
    return Boolean(
      order && order.status === 'RESERVED' && isPaymentRetryable(order.paymentStatus) && !isExpired,
    )
  }, [orderResult.data])

  if (isHydrating || !isAuthenticated) {
    return <OrderDetailSkeleton />
  }

  if (orderError) {
    return (
      <ResourceError
        title='Order error'
        message={orderError.message}
        details={orderError.details}
      />
    )
  }

  if (orderResult.isLoading || !orderResult.data) {
    return <OrderDetailSkeleton />
  }

  const order = orderResult.data

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Order details</h1>
          <p className='mt-1 font-mono text-xs text-muted-foreground'>{order.orderId}</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Created</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.reservedAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Reserved</span>
              <span>{formatDateTime(order.reservedAt)}</span>
            </div>
          ) : null}
          {order.paymentExpiresAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Pay before</span>
              <span>{formatDateTime(new Date(order.paymentExpiresAt * 1000).toISOString())}</span>
            </div>
          ) : null}
          {order.paymentRequestedAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Payment requested</span>
              <span>{formatDateTime(order.paymentRequestedAt)}</span>
            </div>
          ) : null}
          {order.paidAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Paid</span>
              <span>{formatDateTime(order.paidAt)}</span>
            </div>
          ) : null}
          {order.totalAmount ? (
            <div className='flex items-center justify-between text-base font-semibold'>
              <span>Total</span>
              <span>{formatVnd(order.totalAmount)}</span>
            </div>
          ) : null}
          {order.failureReason || order.paymentFailureReason ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
              {order.paymentFailureReason ?? order.failureReason}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className='justify-end gap-3'>
          {order.status === 'PENDING' ? (
            <Button type='button' variant='outline' disabled>
              <RefreshCcw />
              Waiting for reservation...
            </Button>
          ) : null}
          {canPay ? (
            <Link
              href={`/orders/${encodeURIComponent(order.orderId)}/pay`}
              className={buttonVariants()}
            >
              Continue to payment
              <ArrowRight />
            </Link>
          ) : null}
        </CardFooter>
      </Card>

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>Items</h2>
        <div className='space-y-4'>
          {order.items.map((item) => (
            <Card key={item.lineId}>
              <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <CardTitle>{item.productName}</CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    {formatVnd(item.unitPrice)} x {item.quantity}
                  </p>
                </div>
                <div className='text-sm font-medium'>{formatVnd(item.lineTotal)}</div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function OrderDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-8 w-40' />
      <Skeleton className='h-56 w-full' />
      <Skeleton className='h-24 w-full' />
    </div>
  )
}
