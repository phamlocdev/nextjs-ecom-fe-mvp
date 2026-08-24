'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { AvatarUploader } from '@/components/users/avatar-uploader'
import { ResourceError } from '@/components/resource-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireAuth } from '@/hooks/use-require-auth'
import {
  useUpdateUserProfileMutation,
  useUpdateUserRolesMutation,
  useUsersQuery,
} from '@/hooks/use-users'
import { toApiClientError } from '@/lib/api/errors'
import type { ManagedUser } from '@/lib/types'

const ROLES = ['customer', 'manager', 'admin'] as const

export default function AdminUsersPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const usersResult = useUsersQuery()
  const error = usersResult.error ? toApiClientError(usersResult.error) : null

  if (isHydrating || !isAuthenticated || usersResult.isLoading) {
    return <Skeleton className='h-[520px] w-full' />
  }

  if (error) {
    return (
      <ResourceError title='Users endpoint error' message={error.message} details={error.details} />
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Users</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Manage user profile metadata and Cognito group membership.
        </p>
      </div>

      <div className='grid gap-4'>
        {(usersResult.data ?? []).map((user) => (
          <UserRow key={user.sub ?? user.username} user={user} />
        ))}
      </div>
    </div>
  )
}

function UserRow({ user }: { user: ManagedUser }) {
  const [name, setName] = useState(user.profile?.name ?? user.name ?? '')
  const [avatarKey, setAvatarKey] = useState(user.profile?.avatarKey)
  const [groups, setGroups] = useState<Set<string>>(new Set(user.groups))
  const updateProfileMutation = useUpdateUserProfileMutation()
  const updateRolesMutation = useUpdateUserRolesMutation()
  const isPending = updateProfileMutation.isLoading || updateRolesMutation.isLoading
  const sub = user.sub

  async function save() {
    if (!sub) {
      toast.error('User sub is missing')
      return
    }

    try {
      await updateProfileMutation.mutateAsync({
        sub,
        input: { name: name || undefined, avatarKey },
      })
      await updateRolesMutation.mutateAsync({ sub, groups: [...groups] })
      toast.success('User updated')
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  function toggleRole(role: string) {
    setGroups((current) => {
      const next = new Set(current)
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return next
    })
  }

  return (
    <section className='grid gap-4 rounded-md border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_360px_auto] lg:items-center'>
      <div className='min-w-0 space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='truncate font-medium'>{user.email ?? user.username}</p>
          <Badge variant={user.enabled ? 'default' : 'secondary'}>
            {user.enabled ? 'enabled' : 'disabled'}
          </Badge>
          {user.status ? <Badge variant='outline'>{user.status}</Badge> : null}
        </div>
        <p className='font-mono text-xs text-muted-foreground'>{sub ?? user.username}</p>
        <AvatarUploader
          avatarUrl={user.profile?.avatarReadUrl}
          onAvatarKeyChange={(nextAvatarKey) => setAvatarKey(nextAvatarKey)}
        />
      </div>

      <div className='grid gap-3'>
        <Input
          value={name}
          placeholder='Display name'
          onChange={(event) => setName(event.target.value)}
        />
        <div className='flex flex-wrap gap-3 text-sm'>
          {ROLES.map((role) => (
            <label key={role} className='inline-flex items-center gap-2'>
              <input type='checkbox' checked={groups.has(role)} onChange={() => toggleRole(role)} />
              {role}
            </label>
          ))}
        </div>
      </div>

      <Button type='button' disabled={isPending} onClick={() => void save()}>
        <Save />
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </section>
  )
}
