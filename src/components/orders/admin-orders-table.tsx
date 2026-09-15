import Link from 'next/link'
import { Eye } from 'lucide-react'
import { PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

export function AdminOrdersTable({
  orders,
  updatingOrderId,
  onStatusChange,
}: {
  orders: Order[]
  updatingOrderId?: string
  onStatusChange: (order: Order, status: OrderStatus) => void
}) {
  if (orders.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No orders found</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Orders will appear here after checkout.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[28%]'>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='w-20 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const canShip = order.status === 'CONFIRMED' && order.paymentStatus === 'PAID'
            const isUpdating = updatingOrderId === order.orderId

            return (
              <TableRow key={order.orderId}>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate font-mono text-xs font-medium'>{order.orderId}</p>
                    <p className='text-xs text-muted-foreground'>Cart {order.cartId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate text-sm'>{order.customerEmail ?? order.customerId}</p>
                    {order.customerName ? (
                      <p className='truncate text-xs text-muted-foreground'>{order.customerName}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Select
                      value={order.status}
                      disabled={!canShip || isUpdating}
                      onValueChange={(value) => onStatusChange(order, value as OrderStatus)}
                    >
                      <SelectTrigger size='sm' className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={order.status}>{order.status}</SelectItem>
                        {order.status !== 'SHIPPED' ? (
                          <SelectItem value='SHIPPED'>SHIPPED</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    {isUpdating ? (
                      <span className='text-xs text-muted-foreground'>Saving</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell>{formatVnd(order.totalAmount ?? 0)}</TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {formatDateTime(order.createdAt)}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end'>
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                      title='View order'
                      aria-label='View order'
                    >
                      <Eye />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
