import { Badge } from '@/components/ui/badge'
import type { EmailDeliveryStatus } from '@/lib/types'

export function EmailStatusBadge({ status }: { status?: EmailDeliveryStatus }) {
  if (!status) {
    return <Badge variant='outline'>NOT_SENT</Badge>
  }

  return <Badge variant={emailStatusVariant(status)}>{status}</Badge>
}

function emailStatusVariant(
  status: EmailDeliveryStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'DELIVERED':
      return 'default'
    case 'SENT':
    case 'PENDING':
      return 'secondary'
    case 'FAILED':
    case 'REJECTED':
    case 'BOUNCED':
    case 'COMPLAINED':
      return 'destructive'
    case 'SKIPPED':
      return 'outline'
    default:
      return 'outline'
  }
}
