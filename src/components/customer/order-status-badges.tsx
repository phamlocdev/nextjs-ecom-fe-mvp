import { Badge } from '@/components/ui/badge'
import type { OrderStatus, PaymentStatus } from '@/lib/types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderStatusVariant(status)}>{status}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentStatusVariant(status)}>{status}</Badge>
}

function orderStatusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'CONFIRMED':
    case 'RESERVED':
      return 'default'
    case 'FAILED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'destructive'
    case 'PENDING':
      return 'secondary'
    default:
      return 'outline'
  }
}

function paymentStatusVariant(
  status: PaymentStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default'
    case 'FAILED':
      return 'destructive'
    case 'PROCESSING':
      return 'secondary'
    case 'NOT_STARTED':
      return 'outline'
    default:
      return 'outline'
  }
}
