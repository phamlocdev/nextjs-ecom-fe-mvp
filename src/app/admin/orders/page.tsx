'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { ResourceError } from '@/components/resource-error'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrdersQuery, useUpdateOrderStatusMutation } from '@/hooks/use-orders'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import type { Order } from '@/lib/types'

export default function AdminOrdersPage() {
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null)
  const [activeAction, setActiveAction] = useState<{
    orderId: string
    status: 'SHIPPED' | 'CANCELLED'
  } | null>(null)
  const ordersResult = useOrdersQuery()
  const updateStatusMutation = useUpdateOrderStatusMutation()
  const orders = ordersResult.data?.items ?? []
  const error = ordersResult.error ? toApiClientError(ordersResult.error) : null
  const isMutating = updateStatusMutation.isLoading

  async function updateStatus(order: Order, status: 'SHIPPED' | 'CANCELLED') {
    setActiveAction({ orderId: order.orderId, status })
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.orderId, status })
      toast.success(status === 'SHIPPED' ? 'Order marked as shipped' : 'Order cancelled')
      if (status === 'CANCELLED') {
        setCancelOrder(null)
      }
    } catch (statusError) {
      toast.error(toApiClientError(statusError).message, {
        description: apiErrorDescription(statusError),
      })
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Orders</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Manage paid orders powered by the backend `/orders` API.
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
          orders.map((order) => {
            const canUpdate = order.status === 'CONFIRMED' && order.paymentStatus === 'PAID'
            const isShipping =
              activeAction?.orderId === order.orderId && activeAction.status === 'SHIPPED'

            return (
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
                  <div className='flex flex-wrap items-center gap-3'>
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span>Total: {formatVnd(order.totalAmount ?? 0)}</span>
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    {canUpdate ? (
                      <>
                        <Button
                          size='sm'
                          onClick={() => updateStatus(order, 'SHIPPED')}
                          disabled={isMutating}
                        >
                          <CheckCircle2 />
                          {isShipping ? 'Shipping...' : 'Mark shipped'}
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => setCancelOrder(order)}
                          disabled={isMutating}
                        >
                          <XCircle />
                          Cancel order
                        </Button>
                      </>
                    ) : null}
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className='text-primary hover:underline'
                    >
                      View detail
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <AlertDialog
        open={Boolean(cancelOrder)}
        onOpenChange={(open) => !open && setCancelOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <XCircle className='text-destructive' />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancel order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel order{' '}
              <span className='font-medium text-foreground'>{cancelOrder?.orderId}</span> and
              release its reserved inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => cancelOrder && updateStatus(cancelOrder, 'CANCELLED')}
              disabled={isMutating}
            >
              {activeAction?.status === 'CANCELLED' ? 'Cancelling...' : 'Cancel order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
