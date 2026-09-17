'use client'

import { SetSignInPasswordForm } from '@/components/auth/set-sign-in-password-form'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequireAuth } from '@/hooks/use-require-auth'

export default function SetPasswordPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()

  if (isHydrating || !isAuthenticated) {
    return <Skeleton className='h-64 w-full' />
  }

  return <SetSignInPasswordForm />
}
