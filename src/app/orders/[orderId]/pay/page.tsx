'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { ResourceError } from '@/components/resource-error'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderQuery, useTriggerPaymentMutation } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { isPaymentRetryable } from '@/lib/api/orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'

export default function OrderPaymentPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const orderResult = useOrderQuery(orderId)
  const triggerPaymentMutation = useTriggerPaymentMutation()
  const orderError = orderResult.error ? toApiClientError(orderResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return <PaymentSkeleton />
  }

  if (orderError) {
    return (
      <ResourceError
        title='Payment order error'
        message={orderError.message}
        details={orderError.details}
      />
    )
  }

  if (orderResult.isLoading || !orderResult.data) {
    return <PaymentSkeleton />
  }

  const order = orderResult.data
  const isExpired =
    typeof order.paymentExpiresAt === 'number' &&
    order.paymentExpiresAt <= Math.floor(Date.now() / 1000)
  const canTriggerPayment =
    order.status === 'RESERVED' && isPaymentRetryable(order.paymentStatus) && !isExpired

  async function handleTriggerPayment() {
    try {
      await triggerPaymentMutation.mutateAsync(order.orderId)
      await orderResult.refetch()
      toast.success('Payment completed successfully.')
      router.replace(`/orders/${encodeURIComponent(order.orderId)}`)
      router.refresh()
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='space-y-2 text-center'>
        <h1 className='text-3xl font-semibold tracking-normal'>Complete payment</h1>
        <p className='text-sm text-muted-foreground'>
          Confirm payment for order {order.orderId}. The order will be marked as paid immediately.
        </p>
      </div>

      <Card>
        <CardHeader className='items-center text-center'>
          <CardTitle className='text-2xl'>
            {order.totalAmount ? formatVnd(order.totalAmount) : 'Pending total'}
          </CardTitle>
          <div className='flex flex-wrap justify-center gap-2'>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Reserved at</span>
            <span>{order.reservedAt ? formatDateTime(order.reservedAt) : 'Not reserved yet'}</span>
          </div>
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
              <span className='text-muted-foreground'>Paid at</span>
              <span>{formatDateTime(order.paidAt)}</span>
            </div>
          ) : null}
          {order.paymentFailureReason ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive'>
              {order.paymentFailureReason}
            </div>
          ) : null}
          {isExpired && order.status === 'RESERVED' ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive'>
              Payment window expired. This reservation will be released automatically.
            </div>
          ) : null}
        </CardContent>
        <CardFooter className='flex-col gap-3'>
          {order.status === 'CONFIRMED' ? (
            <Link
              href={`/orders/${encodeURIComponent(order.orderId)}`}
              className={buttonVariants({ className: 'w-full' })}
            >
              Back to order
            </Link>
          ) : (
            <Button
              type='button'
              className='w-full'
              disabled={!canTriggerPayment || triggerPaymentMutation.isLoading}
              onClick={() => void handleTriggerPayment()}
            >
              <CreditCard />
              {triggerPaymentMutation.isLoading
                ? 'Completing payment...'
                : order.paymentStatus === 'FAILED'
                  ? 'Retry payment'
                  : 'Complete payment'}
            </Button>
          )}
          <Link
            href={`/orders/${encodeURIComponent(order.orderId)}`}
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
          >
            View order details
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

function PaymentSkeleton() {
  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <Skeleton className='h-10 w-56 mx-auto' />
      <Skeleton className='h-72 w-full' />
    </div>
  )
}
