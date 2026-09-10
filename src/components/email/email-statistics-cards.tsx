import type { ComponentType } from 'react'
import { AlertTriangle, CheckCircle2, MailCheck, MailQuestion } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EmailDeliveryStatistics, EmailDeliveryStatus, EmailType } from '@/lib/types'

const SUCCESS_STATUSES: EmailDeliveryStatus[] = ['DELIVERED']
const ACCEPTED_STATUSES: EmailDeliveryStatus[] = ['SENT', 'PENDING']
const FAILURE_STATUSES: EmailDeliveryStatus[] = ['FAILED', 'REJECTED', 'BOUNCED', 'COMPLAINED']

export function EmailStatisticsCards({
  statistics,
  emailTypes,
}: {
  statistics?: EmailDeliveryStatistics
  emailTypes: EmailType[]
}) {
  const delivered = sumStatuses(statistics, emailTypes, SUCCESS_STATUSES)
  const accepted = sumStatuses(statistics, emailTypes, ACCEPTED_STATUSES)
  const failed = sumStatuses(statistics, emailTypes, FAILURE_STATUSES)
  const skipped = sumStatuses(statistics, emailTypes, ['SKIPPED'])

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <MetricCard
        title='Delivered'
        value={delivered}
        detail='Confirmed by SES'
        icon={CheckCircle2}
      />
      <MetricCard
        title='Accepted'
        value={accepted}
        detail='Pending delivery result'
        icon={MailCheck}
      />
      <MetricCard
        title='Needs attention'
        value={failed}
        detail='Retryable failures may exist'
        icon={AlertTriangle}
      />
      <MetricCard
        title='Skipped'
        value={skipped}
        detail='Not sent by configuration'
        icon={MailQuestion}
      />
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: number
  detail: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <Icon className='size-4 text-primary' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-semibold'>{value}</div>
        <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
      </CardContent>
    </Card>
  )
}

function sumStatuses(
  statistics: EmailDeliveryStatistics | undefined,
  emailTypes: EmailType[],
  statuses: EmailDeliveryStatus[],
): number {
  return emailTypes.reduce(
    (total, emailType) =>
      total + statuses.reduce((sum, status) => sum + (statistics?.[emailType]?.[status] ?? 0), 0),
    0,
  )
}
