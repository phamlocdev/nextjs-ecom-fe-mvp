'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { ResourceError } from '@/components/resource-error'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUserLoginAuditQuery } from '@/hooks/use-user-profile'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import type { UserLoginAudit } from '@/lib/types'

type AuditFilter = 'username' | 'email' | 'userId'

export default function AdminUserLoginAuditPage() {
  const [submittedFilter, setSubmittedFilter] = useState<{
    filter: AuditFilter
    value: string
  } | null>(null)
  const [form, setForm] = useState<{ filter: AuditFilter; value: string }>({
    filter: 'username',
    value: '',
  })
  const auditResult = useUserLoginAuditQuery({
    filter: submittedFilter?.filter ?? 'username',
    value: submittedFilter?.value ?? '',
    enabled: Boolean(submittedFilter?.value),
  })
  const error = auditResult.error ? toApiClientError(auditResult.error) : null
  const items = auditResult.data?.items ?? []

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = form.value.trim()
    if (!value) {
      return
    }
    setSubmittedFilter({ ...form, value })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Login audit</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Query sign-in history for one account by exact username, email, or user id.
        </p>
      </div>

      <form
        className='flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-end'
        onSubmit={handleSubmit}
      >
        <div className='grid gap-2 sm:w-48'>
          <Label>Search by</Label>
          <Select
            value={form.filter}
            onValueChange={(filter) => setForm({ ...form, filter: filter as AuditFilter })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='username'>Username</SelectItem>
              <SelectItem value='email'>Email</SelectItem>
              <SelectItem value='userId'>User ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid flex-1 gap-2'>
          <Label htmlFor='auditSearch'>Exact value</Label>
          <Input
            id='auditSearch'
            value={form.value}
            onChange={(event) => setForm({ ...form, value: event.target.value })}
            placeholder='admin@example.com'
          />
        </div>
        <Button type='submit' disabled={!form.value.trim() || auditResult.isLoading}>
          <Search />
          Search
        </Button>
      </form>

      {error ? (
        <ResourceError
          title='Login audit endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      {auditResult.isLoading ? (
        <Skeleton className='h-64 w-full' />
      ) : submittedFilter && !error ? (
        <LoginAuditTable items={items} />
      ) : null}
    </div>
  )
}

function LoginAuditTable({ items }: { items: UserLoginAudit[] }) {
  if (items.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No login audit entries found</p>
        <p className='mt-1 text-sm text-muted-foreground'>Successful sign-ins will appear here.</p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Login time</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>IP address</TableHead>
            <TableHead>User agent</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>New device</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.loginId}>
              <TableCell className='text-sm'>{formatDateTime(item.loginAt)}</TableCell>
              <TableCell>
                <div className='min-w-0 space-y-1'>
                  <p className='truncate text-sm font-medium'>{item.username ?? item.userId}</p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {item.email ?? item.userId}
                  </p>
                </div>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {item.ipAddress ?? 'N/A'}
              </TableCell>
              <TableCell className='max-w-md truncate text-sm text-muted-foreground'>
                {item.userAgent ?? 'N/A'}
              </TableCell>
              <TableCell className='font-mono text-xs text-muted-foreground'>
                {item.clientId ?? 'N/A'}
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {item.newDeviceUsed ? 'Yes' : 'No'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
