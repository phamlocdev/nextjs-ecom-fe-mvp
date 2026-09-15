import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { EmailStatusBadge } from '@/components/email/email-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOrderEmailTrackingQuery, useResendFailedOrderEmailMutation } from '@/hooks/use-orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import type { EmailTracking, EmailType } from '@/lib/types'

type OrderEmailType = Extract<EmailType, 'ORDER_CONFIRMATION' | 'SHIPPED_ORDER_NOTIFICATION'>

export function OrderEmailTrackingPanel({ orderId }: { orderId: string }) {
  const trackingResult = useOrderEmailTrackingQuery(orderId)
  const resendMutation = useResendFailedOrderEmailMutation(orderId)
  const [resendingKey, setResendingKey] = useState<string>()
  const rows = useMemo(
    () => resolveLatestRecipientRows(trackingResult.data ?? []),
    [trackingResult.data],
  )
  const error = trackingResult.error ? toApiClientError(trackingResult.error) : null

  async function handleResend(row: EmailTracking) {
    if (!isOrderEmailType(row.emailType)) {
      return
    }

    const key = buildRowKey(row)
    setResendingKey(key)
    try {
      const result = await resendMutation.mutateAsync({
        emailType: row.emailType,
        recipientEmail: row.recipientEmail,
      })
      if (result.resentCount === 0) {
        toast.info('This recipient is no longer retryable.')
      } else {
        toast.success(`Resent ${formatEmailType(row.emailType)} to ${row.recipientEmail}.`)
      }
    } catch (resendError) {
      toast.error(toApiClientError(resendError).message)
    } finally {
      setResendingKey(undefined)
    }
  }

  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold'>Email delivery</h2>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Sent emails by recipient</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className='rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
              {error.message}
            </div>
          ) : trackingResult.isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading email attempts...</p>
          ) : rows.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No sent email attempts recorded.</p>
          ) : (
            <div className='overflow-hidden rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className='w-28 text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const key = buildRowKey(row)
                    const isResending = resendingKey === key

                    return (
                      <TableRow key={key}>
                        <TableCell className='text-sm font-medium'>
                          {formatEmailType(row.emailType)}
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <p className='text-sm'>{row.recipientEmail}</p>
                            {row.failureReason ? (
                              <p className='max-w-72 truncate text-xs text-muted-foreground'>
                                {row.failureReason}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <EmailStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className='text-sm'>{row.attemptNumber}</TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatDateTime(row.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className='flex justify-end'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              disabled={!row.isRetryable || isResending || resendMutation.isLoading}
                              onClick={() => void handleResend(row)}
                            >
                              <RefreshCcw />
                              Resend
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function resolveLatestRecipientRows(items: EmailTracking[]): EmailTracking[] {
  const latestByEmailTypeAndRecipient = new Map<string, EmailTracking>()

  for (const item of items.filter((tracking) => isOrderEmailType(tracking.emailType))) {
    const key = `${item.emailType}:${item.recipientEmail}`
    const current = latestByEmailTypeAndRecipient.get(key)
    if (!current || item.createdAt > current.createdAt) {
      latestByEmailTypeAndRecipient.set(key, item)
    }
  }

  return [...latestByEmailTypeAndRecipient.values()].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
}

function buildRowKey(row: EmailTracking): string {
  return `${row.emailType}:${row.recipientEmail}:${row.emailId}`
}

function isOrderEmailType(emailType: EmailType): emailType is OrderEmailType {
  return emailType === 'ORDER_CONFIRMATION' || emailType === 'SHIPPED_ORDER_NOTIFICATION'
}

function formatEmailType(emailType: EmailType): string {
  switch (emailType) {
    case 'ORDER_CONFIRMATION':
      return 'Order confirmation'
    case 'SHIPPED_ORDER_NOTIFICATION':
      return 'Shipped notification'
    case 'WELCOME_NEW_CUSTOMER':
      return 'Welcome new customer'
    default:
      return emailType
  }
}
