'use client'

import { UserProfileForm } from '@/components/users/user-profile-form'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireAuth } from '@/hooks/use-require-auth'

export default function AdminProfilePage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()

  if (isHydrating || !isAuthenticated) {
    return <Skeleton className='h-96 w-full' />
  }

  return <UserProfileForm title='Admin profile' />
}
