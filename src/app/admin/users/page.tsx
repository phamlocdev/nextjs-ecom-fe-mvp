'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordInput } from '@/components/auth/password-input'
import { EmailStatisticsCards } from '@/components/email/email-statistics-cards'
import { ResourceError } from '@/components/resource-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountsTable } from '@/components/users/accounts-table'
import {
  useCreateManagedUserMutation,
  useDisableManagedUserMutation,
  useResetManagedUserPasswordMutation,
  useResendFailedWelcomeEmailMutation,
  useUserEmailStatisticsQuery,
  useUsersQuery,
} from '@/hooks/use-user-profile'
import { toApiClientError } from '@/lib/api/errors'
import type { ManagedUser } from '@/lib/types'
import { useAuthStore } from '@/store/auth-store'

export default function AdminUsersPage() {
  const usersResult = useUsersQuery()
  const statisticsResult = useUserEmailStatisticsQuery()
  const createUserMutation = useCreateManagedUserMutation()
  const disableUserMutation = useDisableManagedUserMutation()
  const resetPasswordMutation = useResetManagedUserPasswordMutation()
  const resendMutation = useResendFailedWelcomeEmailMutation()
  const { userId } = useAuthStore()
  const [resendingUserId, setResendingUserId] = useState<string>()
  const [disablingUserId, setDisablingUserId] = useState<string>()
  const [resettingPasswordUser, setResettingPasswordUser] = useState<ManagedUser | null>(null)
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

  async function handleCreateUser(input: CreateAccountFormValues) {
    try {
      await createUserMutation.mutateAsync({
        ...input,
        permissions: [],
      })
      toast.success(`Created account ${input.username}.`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
      throw error
    }
  }

  async function handleDisableUser(user: ManagedUser) {
    if (!user.sub) {
      return
    }

    setDisablingUserId(user.sub)
    try {
      await disableUserMutation.mutateAsync(user.sub)
      toast.success(`Disabled ${user.username}.`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setDisablingUserId(undefined)
    }
  }

  async function handleResetPassword(input: ResetPasswordFormValues) {
    if (!resettingPasswordUser?.sub) {
      return
    }

    try {
      await resetPasswordMutation.mutateAsync({
        userId: resettingPasswordUser.sub,
        input: { password: input.password },
      })
      toast.success(`Set a temporary password for ${resettingPasswordUser.username}.`)
      setResettingPasswordUser(null)
    } catch (error) {
      toast.error(toApiClientError(error).message)
      throw error
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Accounts</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Manage Cognito accounts, access token permissions, and welcome email delivery.
          </p>
        </div>
        <CreateAccountDialog isPending={createUserMutation.isLoading} onCreate={handleCreateUser} />
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
          currentUserId={userId}
          disablingUserId={disablingUserId}
          resettingPasswordUserId={
            resetPasswordMutation.isLoading ? resettingPasswordUser?.sub : undefined
          }
          onResendWelcome={handleResendWelcome}
          onDisableUser={handleDisableUser}
          onResetPassword={setResettingPasswordUser}
        />
      ) : null}

      <ResetPasswordDialog
        user={resettingPasswordUser}
        isPending={resetPasswordMutation.isLoading}
        onOpenChange={(open) => {
          if (!open && !resetPasswordMutation.isLoading) {
            setResettingPasswordUser(null)
          }
        }}
        onReset={handleResetPassword}
      />
    </div>
  )
}

type CreateAccountFormValues = {
  username: string
  email: string
  password: string
  name?: string
  group: 'customer' | 'manager' | 'admin'
}

type ResetPasswordFormValues = {
  password: string
  confirmPassword: string
}

function CreateAccountDialog({
  isPending,
  onCreate,
}: {
  isPending: boolean
  onCreate: (input: CreateAccountFormValues) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateAccountFormValues>({
    username: '',
    email: '',
    password: '',
    name: '',
    group: 'customer',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({
      ...form,
      name: form.name?.trim() || undefined,
    })
    setOpen(false)
    setForm({ username: '', email: '', password: '', name: '', group: 'customer' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type='button' onClick={() => setOpen(true)}>
        <Plus />
        Create account
      </Button>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
          <DialogDescription>
            New accounts start with no permissions until you update the checklist.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='password'>Temporary password</Label>
            <Input
              id='password'
              type='password'
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className='grid gap-2'>
            <Label>Group</Label>
            <Select
              value={form.group}
              onValueChange={(group) =>
                setForm({ ...form, group: group as CreateAccountFormValues['group'] })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='customer'>customer</SelectItem>
                <SelectItem value='manager'>manager</SelectItem>
                <SelectItem value='admin'>admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({
  user,
  isPending,
  onOpenChange,
  onReset,
}: {
  user: ManagedUser | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onReset: (input: ResetPasswordFormValues) => Promise<void>
}) {
  const [form, setForm] = useState<ResetPasswordFormValues>({
    password: '',
    confirmPassword: '',
  })
  const passwordsMatch = form.password === form.confirmPassword

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!passwordsMatch) {
      toast.error('Passwords do not match.')
      return
    }

    await onReset(form)
    setForm({ password: '', confirmPassword: '' })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setForm({ password: '', confirmPassword: '' })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a temporary password for {user?.username}. They must change it on next sign in.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='temporaryPassword'>Temporary password</Label>
            <PasswordInput
              id='temporaryPassword'
              autoComplete='new-password'
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='confirmTemporaryPassword'>Confirm temporary password</Label>
            <PasswordInput
              id='confirmTemporaryPassword'
              autoComplete='new-password'
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              required
              minLength={8}
            />
            {!passwordsMatch ? (
              <p className='text-xs text-destructive'>Passwords do not match.</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !passwordsMatch}>
              {isPending ? 'Saving...' : 'Reset password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UsersSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-64 w-full' />
    </div>
  )
}
