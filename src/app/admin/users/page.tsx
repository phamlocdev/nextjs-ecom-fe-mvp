'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { EmailStatisticsCards } from '@/components/email/email-statistics-cards'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountsTable } from '@/components/users/accounts-table'
import {
  useResendFailedWelcomeEmailMutation,
  useUserEmailStatisticsQuery,
  useUsersQuery,
} from '@/hooks/use-user-profile'
import { toApiClientError } from '@/lib/api/errors'
import type { ManagedUser } from '@/lib/types'

export default function AdminUsersPage() {
  const usersResult = useUsersQuery()
  const statisticsResult = useUserEmailStatisticsQuery()
  const resendMutation = useResendFailedWelcomeEmailMutation()
  const [resendingUserId, setResendingUserId] = useState<string>()
  const users = usersResult.data ?? []
  const usersError = usersResult.error ? toApiClientError(usersResult.error) : null
  const statisticsError = statisticsResult.error ? toApiClientError(statisticsResult.error) : null

  async function handleResendWelcome(user: ManagedUser) {
    const recipientEmail = user.welcomeEmailTracking?.recipientEmail
    if (!user.sub || !recipientEmail) {
      return
    }

    setResendingUserId(user.sub)
    try {
      const result = await resendMutation.mutateAsync({
        userId: user.sub,
        recipientEmail,
      })
      if (result.resentCount === 0) {
        toast.info('This recipient is no longer retryable.')
      } else {
        toast.success(`Resent welcome email to ${recipientEmail}.`)
      }
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setResendingUserId(undefined)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Accounts</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage Cognito accounts and welcome email delivery.
          </p>
        </div>
      </div>

      {usersError ? (
        <ResourceError
          title='Users endpoint error'
          message={usersError.message}
          details={usersError.details}
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
        emailTypes={['WELCOME_NEW_CUSTOMER']}
      />

      {usersResult.isLoading ? (
        <UsersSkeleton />
      ) : !usersError ? (
        <AccountsTable
          users={users}
          resendingUserId={resendingUserId}
          onResendWelcome={handleResendWelcome}
        />
      ) : null}
    </div>
  )
}

function UsersSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-64 w-full' />
    </div>
  )
}
