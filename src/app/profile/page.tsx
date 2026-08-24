'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { ResourceError } from '@/components/resource-error'
import { AvatarUploader } from '@/components/users/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { useMeQuery, useUpdateMeMutation } from '@/hooks/use-users'
import { toApiClientError } from '@/lib/api/errors'
import type { CustomerProfile } from '@/lib/types'

export default function ProfilePage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const meResult = useMeQuery()
  const error = meResult.error ? toApiClientError(meResult.error) : null

  if (isHydrating || !isAuthenticated || meResult.isLoading) {
    return <Skeleton className='h-[420px] w-full' />
  }

  if (error) {
    return (
      <ResourceError
        title='Profile endpoint error'
        message={error.message}
        details={error.details}
      />
    )
  }

  if (!meResult.data) {
    return null
  }

  return <ProfileForm profile={meResult.data} />
}

function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const updateMeMutation = useUpdateMeMutation()
  const [name, setName] = useState(profile.name ?? '')
  const [avatarKey, setAvatarKey] = useState<string | undefined>(profile.avatarKey)

  async function save() {
    try {
      await updateMeMutation.mutateAsync({ name: name || undefined, avatarKey })
      toast.success('Profile updated')
    } catch (saveError) {
      toast.error(toApiClientError(saveError).message)
    }
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Profile</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Manage your display name and avatar.</p>
      </div>

      <section className='space-y-4 rounded-md border bg-card p-4'>
        <AvatarUploader
          avatarUrl={profile.avatarReadUrl}
          onAvatarKeyChange={(nextAvatarKey) => setAvatarKey(nextAvatarKey)}
        />
        <div className='space-y-2'>
          <Label htmlFor='name'>Display name</Label>
          <Input id='name' value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className='grid gap-1 text-sm text-muted-foreground'>
          <p>{profile.email}</p>
          <p className='font-mono text-xs'>{profile.sub}</p>
        </div>
        <Button type='button' disabled={updateMeMutation.isLoading} onClick={() => void save()}>
          <Save />
          {updateMeMutation.isLoading ? 'Saving...' : 'Save profile'}
        </Button>
      </section>
    </div>
  )
}
