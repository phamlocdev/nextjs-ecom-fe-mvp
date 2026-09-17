'use client'

import Link from 'next/link'
import { Ban, KeyRound, RefreshCcw } from 'lucide-react'
import { EmailStatusBadge } from '@/components/email/email-status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import type { ManagedUser } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AccountsTable({
  users,
  resendingUserId,
  currentUserId,
  disablingUserId,
  resettingPasswordUserId,
  onResendWelcome,
  onDisableUser,
  onResetPassword,
}: {
  users: ManagedUser[]
  resendingUserId?: string
  currentUserId?: string | null
  disablingUserId?: string
  resettingPasswordUserId?: string
  onResendWelcome: (user: ManagedUser) => void
  onDisableUser: (user: ManagedUser) => void
  onResetPassword: (user: ManagedUser) => void
}) {
  if (users.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No accounts found</p>
        <p className='mt-1 text-sm text-muted-foreground'>Cognito users will appear here.</p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[28%]'>Account</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Welcome email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='w-28 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const tracking = user.welcomeEmailTracking
            const canResend = Boolean(user.sub && tracking?.recipientEmail && tracking.isRetryable)
            const isResending = resendingUserId === user.sub
            const isSelf = Boolean(currentUserId && user.sub === currentUserId)
            const canMutate = Boolean(user.sub && !isSelf)

            return (
              <TableRow key={user.username}>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate text-sm font-medium'>{user.name ?? user.username}</p>
                    <p className='truncate font-mono text-[11px] text-muted-foreground'>
                      {user.sub ?? user.username}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='space-y-1'>
                    <p className='text-sm'>{user.email ?? 'No email'}</p>
                    <p className='text-xs text-muted-foreground'>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='space-y-1 text-sm'>
                    <p>{user.groups.join(', ') || 'No groups'}</p>
                    <p className='text-xs text-muted-foreground'>
                      {user.permissions.length} permissions
                    </p>
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {user.enabled ? (user.accountStatus ?? user.status ?? 'Enabled') : 'Disabled'}
                </TableCell>
                <TableCell>
                  <div className='space-y-1'>
                    <EmailStatusBadge status={tracking?.status} />
                    {tracking ? (
                      <p className='text-xs text-muted-foreground'>
                        Attempt {tracking.attemptNumber} - {formatDateTime(tracking.updatedAt)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end gap-2'>
                    {user.sub ? (
                      <Link
                        href={`/admin/users/${encodeURIComponent(user.sub)}/access`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        <KeyRound />
                        Permissions
                      </Link>
                    ) : null}
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={!canResend || isResending}
                      onClick={() => onResendWelcome(user)}
                    >
                      <RefreshCcw />
                      Resend
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={!canMutate || resettingPasswordUserId === user.sub}
                      onClick={() => onResetPassword(user)}
                    >
                      <KeyRound />
                      Reset
                    </Button>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      disabled={!canMutate || !user.enabled || disablingUserId === user.sub}
                      onClick={() => onDisableUser(user)}
                    >
                      <Ban />
                      Disable
                    </Button>
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
