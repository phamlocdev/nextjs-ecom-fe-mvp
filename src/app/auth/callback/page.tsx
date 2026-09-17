'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  completeHostedUiCallback,
  getHostedUiRedirectError,
  storeHostedUiAuthErrorToast,
} from '@/lib/auth'
import { recordLoginContext } from '@/lib/api/users'
import { useAuthStore } from '@/store/auth-store'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    const next = searchParams.get('next') || '/'
    const redirectError = getHostedUiRedirectError(window.location.href)

    if (redirectError) {
      storeHostedUiAuthErrorToast(redirectError)
      router.replace('/auth/login')
      return
    }

    completeHostedUiCallback(window.location.href)
      .then(() => hydrate(true))
      .then((session) => {
        if (session.isAuthenticated) {
          void recordLoginContext().catch(() => undefined)
          router.replace(next)
          router.refresh()
          return
        }

        router.replace('/auth/login')
      })
      .catch((error) => {
        storeHostedUiAuthErrorToast(error)
        router.replace('/auth/login')
      })
  }, [hydrate, router, searchParams])

  return (
    <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center text-sm text-muted-foreground'>
      Completing sign in...
    </div>
  )
}
