import { listManagedUsersAsAdmin } from '@/lib/api'
import { formatDateTime, toErrorSummary } from '@/lib/format'
import type { ManagedUser } from '@/lib/types'
import { ResourceError } from '@/components/resource-error'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null }
  } catch (error) {
    return { data: null, error: toErrorSummary(error) }
  }
}

export default async function AdminUsersPage() {
  const usersResult = await safeLoad(listManagedUsersAsAdmin)
  const users = usersResult.data ?? []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal'>Users</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Review Cognito users across all roles directly from the admin workspace.
          </p>
        </div>
      </div>

      {usersResult.error ? (
        <ResourceError
          title='Users endpoint error'
          message={usersResult.error.message}
          details={usersResult.error.details}
        />
      ) : null}

      {!usersResult.error ? (
        <div className='grid gap-4 xl:grid-cols-[0.8fr_1.2fr]'>
          <UsersSummary users={users} />
          <UsersTable users={users} />
        </div>
      ) : null}
    </div>
  )
}

function UsersSummary({ users }: { users: ManagedUser[] }) {
  const admins = users.filter((user) => user.groups.includes('admin')).length
  const managers = users.filter((user) => user.groups.includes('manager')).length
  const customers = users.filter((user) => user.groups.includes('customer')).length
  const confirmed = users.filter((user) => user.status === 'CONFIRMED').length

  return (
    <Card className='h-fit'>
      <CardHeader>
        <CardTitle>User Overview</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-3'>
        <MetricRow label='Total users' value={String(users.length)} />
        <MetricRow label='Admins' value={String(admins)} />
        <MetricRow label='Managers' value={String(managers)} />
        <MetricRow label='Customers' value={String(customers)} />
        <MetricRow label='Confirmed accounts' value={String(confirmed)} />
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-3'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='text-base font-semibold'>{value}</span>
    </div>
  )
}

function UsersTable({ users }: { users: ManagedUser[] }) {
  if (users.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No users yet</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Create or register a user to see them appear here.
        </p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.username}>
              <TableCell>
                <div className='space-y-1'>
                  <p className='font-medium'>{user.username}</p>
                  <p className='text-xs text-muted-foreground'>
                    {user.email ?? 'No email attribute'}
                  </p>
                  <p className='text-[11px] text-muted-foreground'>
                    Email verified: {user.emailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex flex-col gap-2'>
                  <Badge variant={user.enabled ? 'default' : 'secondary'}>
                    {user.enabled ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                  {user.status ? <Badge variant='outline'>{user.status}</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex flex-wrap gap-2 whitespace-normal'>
                  {user.groups.length > 0 ? (
                    user.groups.map((group) => (
                      <Badge key={`${user.username}:${group}`} variant='outline'>
                        {group}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>No groups</span>
                  )}
                </div>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {user.updatedAt ? formatDateTime(user.updatedAt) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
